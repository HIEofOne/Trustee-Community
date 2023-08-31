import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { isLoggedIn } from '../../lib/auth';
import Credentials from '../../components/credentials';
import moment from 'moment';
import objectPath from 'object-path';
import sortArray from 'sort-array';
import { withIronSessionSsr } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';
import { InferGetServerSidePropsType } from 'next';
import { SSX, SiweMessage } from '@spruceid/ssx';

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import { FormControl } from "@mui/material";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

//Landing Page
const RequestAccess = ({
  userId, jwt
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const steps = ['Select Patient', 'Requested Data', 'Purpose', 'Gather Credentials'];
  const purpose = [
    "Clinical - Routine",
    "Clinical - Emergency",
    "Research",
    "Customer Support",
    "Other"
  ];
  const [patient, setPatient] = useState("");
  const [resources, setResources] = useState<object[]>([]);
  const [resourceType, setResourceType] = useState<string[]>([]);
  const [checkedPurpose, setCheckedPurpose] = useState(
    new Array(purpose.length).fill(false)
  );
  const [selectedResource, setSelectedResource] = useState<string[]>([]);
  const [selectedScope, setSelectedScope] = useState<string[]>([]);
  const [selectedPurpose, setSelctedPurpose] = useState<string[]>([]);
  const [nextReady, setNextReady] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set<number>());
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [doc, setDoc] = useState({});
  const [pending, setPending] = useState<object[]>([]);
  const [allResources, setAllResources] = useState(false);
  const [finishStatus, setFinishStatus] = useState(false);
  const [credsStatus, setCredsStatus] = useState(false);

  const isStepOptional = (step: number) => {
    return false;
  };
  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };
  const handleNext = async() => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    if (activeStep === 0) {
      if (!validate(patient)) {
        setIsError(true)
        setError('Email is not valid format')
        setActiveStep(0)
      } else {
        const isPatient = await fetch("/api/couchdb/patients/" + patient,
          { method: "GET", headers: {"Content-Type": "application/json"} })
          .then((res) => res.json()).then((json) => objectPath.has(json, 'resource_server'));
        if (!isPatient) {
          setIsError(true)
          setError('Email has no resources')
          setActiveStep(0)
        } else {
          const body = {email: patient, filter: ''};
          const resources = await fetch("/api/as/resources",
            { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
            .then((res) => res.json());
          sortArray(resources, {by: 'type', order: 'asc'});
          setResources(resources);
        }
      }
    } else if (activeStep === 2) {
      const ssx = new SSX();
      await ssx.signIn();
      const address = ssx.userAuthorization.address();
      const chainId = ssx.userAuthorization.chainId();
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = 'Sign this records request';
      const resource_url = origin + '/review/' + objectPath.get(doc, 'interact_nonce.value')
      const resource_arr = [];
      resource_arr.push(resource_url);
      for (var a of pending) {
        for (var b of objectPath.get(a, 'locations')) {
          resource_arr.push(b);
        }
      }
      const siwemessage = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId,
        resources: resource_arr
      });
      const siwemessage_prep = siwemessage.prepareMessage();
      const sig = await ssx.userAuthorization.signMessage(siwemessage_prep);
      const message = siwemessage_prep.replace(/(?:\r\n|\r|\n)/g, '\n');
      objectPath.set(doc, 'siwe', {sig, message});
      objectPath.set(doc, 'pending_resources', pending);
      objectPath.set(doc, 'request_date', moment().format());
      setDoc(doc);
      const update = await fetch("/api/as/update",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(doc)})
        .then((res) => res.json());
      if (update.success) {
        const sendgrid = await fetch("/api/sendgrid", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: objectPath.get(doc, 'pending_resources.0.ro'),
            subject: "HIE of One - Resource Privilege Request",
            html: `<div><h1>HIE of One Trustee Resource Privilege Request</h1><h2><a href="${resource_url}">New Privileges Requested for your Resources</a></h2></div>`,
          })
        });
        const { error } = await sendgrid.json();
        if (error) {
          console.log(error);
        }
      }
    } else {
      setNextReady(true);
    }
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setNextReady(false);
  };
  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };
  const handleReset = () => {
    setActiveStep(0);
  };
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      }
    }
  };
  const handleResourceChange = (e: SelectChangeEvent<typeof resourceType>) =>{
    const {
      target: { value },
    } = e;
    const arr_value = typeof value === 'string' ? value.split(',') : value
    const all_find = arr_value.find((a) => a === 'all')
    if (all_find) {
      if (!allResources) {
        if (resourceType.length === 0) {
          var all: Array<string> = [];
          var all_scopes: Array<string> = [];
          for (var resource of resources) {
            all.push(objectPath.get(resource, 'type'))
            for (var scope of objectPath.get(resource, 'actions')) {
              if (!all_scopes.includes(scope)) {
                all_scopes.push(scope)
              }
            }
          }
          setPending(resources);
          setResourceType(all);
          setSelectedScope(all_scopes);
          setSelectedResource(all);
          setNextReady(false);
          setAllResources(true);
        } else {
          setResourceType([]);
          setSelectedScope([]);
          setSelectedResource([]);
          setNextReady(true);
        }
      } else {
        setPending([]);
        setResourceType([]);
        setSelectedScope([]);
        setSelectedResource([]);
        setNextReady(true);
        setAllResources(false);
      }
    } else {
      const find = resources.findIndex((resource) => objectPath.get(resource, 'type') == arr_value);
      setResourceType(arr_value);
      console.log(pending)
      pending.push(resources[find]);
      console.log(pending)
      setPending(pending);
      setSelectedScope(objectPath.get(resources, find + '.' + 'actions'))
      setSelectedResource(arr_value);
      setNextReady(false);
    }
  }
  const updatePurpose = (position: number) => {
    const updated = checkedPurpose.map((item, index) =>
      index === position ? !item : item
    );
    setCheckedPurpose(updated);
    const value = purpose.filter((item, index) => {
      if (updated[index] == true) {
        return item;
      }
    });
    setSelctedPurpose(value);
    objectPath.set(doc, "purpose", value);
    setDoc(doc);
    setNextReady(false);
  };
  const generateRequest = useCallback(async() => {
    if (!objectPath.has(doc, '_id')) {
      const generate = await fetch("/api/as/generate",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ email: userId })})
        .then((res) => res.json());
      if (generate.success) {
        setDoc(generate.doc);
        setCredsStatus(true);
      }
    }
  }, [doc, userId]);
  const validate = (inputText: string) => {
    const emailRegex = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, "gm");
    return emailRegex.test(inputText);
  }
  const updateDoc = (new_doc: object) => {
    setDoc(new_doc);
  }
  const closeCredential = () => {
    setFinishStatus(true);
  }

  useEffect(() => {
    generateRequest();
  }, [generateRequest]);

  if (!finishStatus) {
    if (credsStatus) {
      return (
        <Credentials id={objectPath.get(doc, 'interact_nonce.value')} doc={doc} update_doc={updateDoc} interact={false} close={closeCredential} email={userId}/>
      );
    } else {
      return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
          >
          <CircularProgress />
        </Backdrop>
      );
    }
  } else {
    return (
      <div>
        <h2>Request to Access Records</h2>
        <Box sx={{ width: '100%' }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => {
              const stepProps: { completed?: boolean; } = {};
              const labelProps: {
                optional?: React.ReactNode;
              } = {};
              if (isStepOptional(index)) {
                labelProps.optional = (
                  <Typography variant="caption">Optional</Typography>
                );
              }
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel {...labelProps}>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
          {activeStep === steps.length ? (
            <React.Fragment>
              <Typography sx={{ mt: 2, mb: 1 }}>
                All steps completed - you&apos;re finished
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleReset}>Reset</Button>
              </Box>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {activeStep === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <TextField
                    error={isError}
                    helperText={error}
                    variant="standard"
                    label="Patient Email"
                    value={patient}
                    onChange={(e) => {setPatient(e.target.value); setNextReady(false);}}
                    required />
                </Box>
              ) : activeStep === 1 ? (
                <div>
                  <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                    <FormControl sx={{ m: 1, width: 300 }}>
                      <InputLabel id="multiple-checkbox-label">Resources</InputLabel>
                      <Select
                        labelId="multiple-checkbox-label"
                        id="multiple-checkbox"
                        multiple
                        value={resourceType}
                        onChange={handleResourceChange}
                        input={<OutlinedInput label="Resources" />}
                        renderValue={(selected) => selected.join(', ')}
                        MenuProps={MenuProps}
                      >
                        <MenuItem key="all" value="all">
                          <Checkbox checked={allResources}/>
                          <ListItemText primary="Select All" />
                        </MenuItem>
                        {resources.map((resource, index) => (
                          <MenuItem key={index} value={objectPath.get(resource, 'type')}>
                            <Checkbox checked={resourceType.indexOf(objectPath.get(resource, 'type')) > -1} />
                            <ListItemText primary={objectPath.get(resource, 'type')} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </div>
              ) : activeStep === 2 ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <FormGroup>
                    {purpose.map((name, index) => {
                      return (
                        <FormControlLabel key={index} label={name} control={<Checkbox id={`custom-checkbox-${index}`}
                          name={name}
                          value={name}
                          checked={checkedPurpose[index]}
                          onChange={() => updatePurpose(index)} />} />
                      );
                    })}
                  </FormGroup>
                </Box>
              ) : activeStep === 3 ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <div>
                    <p>
                      Your Etherium address will be used to access your verifiable
                      credentials and to sign your request.
                    </p>
                  </div>
                </Box>
              ) : (
                <Typography>finished</Typography>
              )} 
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {isStepOptional(activeStep) && (
                  <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }}>
                    Skip
                  </Button>
                )}
                <Button onClick={handleNext} disabled={nextReady}>
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
        </Box>
        <Box>
          <h3>Details of request:</h3>    
          <Typography>Patient: {patient}</Typography>
          <Typography>Requested Data: {selectedResource.join(", ")}</Typography>
          <Typography>Scope: {selectedScope.join(", ")}</Typography>
          <Typography>Purpose: {selectedPurpose.join(", ")}</Typography>
        </Box>
      </div>
    );
  }
};

export default RequestAccess;

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
  resolvedUrl
}) {
    if (!isLoggedIn(req)) {
      return {
        redirect: {
          destination: `/?from=${encodeURIComponent(resolvedUrl)}`,
          permanent: false
        }
      };
    }
    return {
      props: {
        userId: req.session.userId ?? null,
        jwt: req.session.jwt ?? null,
      }
    };
  },
  sessionOptions
);
