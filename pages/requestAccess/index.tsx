import * as React from "react";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "../../components/connectWallet";
import SignMessage from "../../components/signMessage";
import moment, { Moment } from "moment";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import { FormControl, List } from "@mui/material";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// import SignInWithEthereum from "../../components/SignInWithEthereum";

//Landing Page
const RequestAccess = () => {
  const [patient, setPatient] = useState("");
  const [credential, setCredential] = useState("");
  const [request, setRequest] = useState("");
  const [resourceType, setResourceType] = useState<string[]>([]);
  // const [resourceDate, setResourceDate] = useState(new Date());
  const [resourceDate, setResourceDate] = useState(moment());
  const [formatedDate, setFormatedDate] = useState("");
  const [nextReady, setNextReady] = useState(true);
  const steps = ['Select Patient', 'Requested Data', 'From Date', 'Scope of Access', 'Purpose', 'Gather Credentials'];
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set<number>());
  const isStepOptional = (step: number) => {
    return false;
  };
  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };
  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    if (activeStep === 1) {
      setFormatedDate(resourceDate.format('MM/DD/YYYY'));
      setNextReady(false);
    } else {
      setNextReady(true);
    }
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
  const handleDateChange = (newValue: Moment | null) => {
    if (newValue !== null) {
      setResourceDate(newValue);
      setFormatedDate(newValue.format('MM/DD/YYYY'));
      setNextReady(false);
    }
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
  const resources = [
    {
      "resource": "allergy_intolerances",
      "label": "Allergies",
    },
    {
      "resource": "appointments",
      "label": "Appointments",
    },
    {
      "resource": "bundles",
      "label": "Bundles",
    },
    {
      "resource": "care_plans",
      "label": "Care Plans",
    },
    {
      "resource": "claims",
      "label": "Claims",
    },
    {
      "resource": "communications",
      "label": "Communications",
    },
    {
      "resource": "compositions",
      "label": "Compositions",
    },
    {
      "resource": "conditions",
      "label": "Conditions",
    },
    {
      "resource": "document_references",
      "label": "Documents",
    },
    {
      "resource": "encounters",
      "label": "Encounters",
    },
    {
      "resource": "immunizations",
      "label": "Immunizations",
    },
    {
      "resource": "invoices",
      "label": "Invoices",
    },
    {
      "resource": "medication_requests",
      "label": "Medication Requests",
    },
    {
      "resource": "medication_statements",
      "label": "Medications",
    },
    {
      "resource": "observations",
      "label": "Observations",
    },
    {
      "resource": "patients",
      "label": "Patients",
    },
    {
      "resource": "service_requests",
      "label": "Service Requests",
    }
  ];
  const handleResourceChange = (e: SelectChangeEvent<typeof resourceType>) =>{
    const {
      target: { value },
    } = e;
    const arr_value = typeof value === 'string' ? value.split(',') : value
    const all_find = arr_value.find((a)=> a === 'all')
    if (all_find) {
      if (resourceType.length === 0) {
        var all: Array<string> = [];
        resources.map((resource, index) => (
          all.push(resource.resource)
        ));
        setResourceType(all);
        setSelectedResource(all);
        setNextReady(false);
      } else {
        setResourceType([]);
        setSelectedResource([]);
        setNextReady(true);
      }
    } else {
      setResourceType(arr_value);
      setSelectedResource(arr_value);
      setNextReady(false);
    }
  }
  const [selectedResource, setSelectedResource] = useState<string[]>([]);
  var scope = ["Read", "Update", "Create"];
  const [checkedScope, setCheckedScope] = useState(
    new Array(scope.length).fill(false)
  );
  const [selectedScope, setSelectedScope] = useState<string[]>([]);
  const [selectedPurpose, setSelctedPurpose] = useState<string[]>([]);
  var purpose = [
    "Clinical - Routine",
    "Clinical - Emergency",
    "Research",
    "Customer Support",
    "Other"
  ];
  const [checkedPurpose, setCheckedPurpose] = useState(
    new Array(purpose.length).fill(false)
  );
  const updateScope = (position: number) => {
    const updated = checkedScope.map((item, index) =>
      index === position ? !item : item
    );
    setCheckedScope(updated);
    const value = scope.filter((item, index) => {
      if (updated[index] == true) {
        return item;
      }
    });
    setSelectedScope(value);
    setNextReady(false);
  };
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
    setNextReady(false);
  };
  const generateRequest = () => {
    var request = `
Details of request:    
Patient: ${patient}
Scope: ${selectedScope}
Purpose: ${selectedPurpose}`;
    setRequest(request);
    return [patient, selectedScope, selectedPurpose];
  };
  // called when sign message is done
  const callback = async (
    data: any,
    recoveredAddress: any,
    message: string
  ) => {
    const req = generateRequest();
    var body = {
      data: {
        patient: req[0],
        clinician: recoveredAddress,
        scope: req[1],
        purpose: req[2],
        message: message,
        state: "initiated",
        date: moment().format('MM/DD/YYYY'),
        request_data: {
          type: resourceType,
          from: "Apple Health",
          date: resourceDate.format('MM/DD/YYYY')
        }
      }
    };
    if (data) {
      await fetch("/api/couchdb/requests/new", 
        { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
        .then((res) => res.json()).then((json) => console.log(json));
    }
  };
  useEffect(() => {
    generateRequest(); // This is be executed when `loading` state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, scope, purpose]);

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
                        <Checkbox checked={false} />
                        <ListItemText primary="Select All" />
                      </MenuItem>
                      {resources.map((resource, index) => (
                        <MenuItem key={index} value={resource.resource}>
                          <Checkbox checked={resourceType.indexOf(resource.resource) > -1} />
                          <ListItemText primary={resource.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </div>
             ) : activeStep === 2 ? (
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <DatePicker
                  label="Date"
                  value={resourceDate}
                  onChange={handleDateChange}
                />
              </Box>
             ) : activeStep === 3 ? (
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <FormGroup>
                  {scope.map((name, index) => {
                    return (
                      <FormControlLabel key={index} label={name} control={<Checkbox id={`custom-checkbox-${index}`}
                        name={name}
                        value={name}
                        checked={checkedScope[index]}
                        onChange={() => updateScope(index)} />} />
                    );
                  })}
                </FormGroup>
              </Box>
             ) : activeStep === 4 ? (
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
             ) : activeStep === 5 ? (
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <div>
                  <p>
                    Your Etherium address will be used to access your verifiable
                    credentials and to sign your request.
                  </p>
                  <Ethereum req={request} callback={callback}>
                    <Box
                      sx={{
                        '& .MuiTextField-root': { m: 1, width: '25ch' },
                      }}
                    >
                      <TextField
                        variant="standard"
                        value={credential}
                        onChange={(e) => {setCredential(e.target.value); setNextReady(false);}}
                        placeholder="Verifiable Credential"
                        required />
                      <Button variant="contained" type="submit">
                        Search
                      </Button>
                    </Box>
                  </Ethereum>
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
        <Typography>From Date: {formatedDate}</Typography>
        <Typography>Scope: {selectedScope.join(", ")}</Typography>
        <Typography>Purpose: {selectedPurpose.join(", ")}</Typography>
      </Box>
    </div>
  );
};

//@ts-ignore
function Ethereum(props) {
  const { isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  const { children, req, callback } = props;

  if (isConnected) {
    return (
      <div>
        <ConnectWallet />
        <p>1. Select a Verifiable Credential</p>
        {children}
        <p>2. Add Message</p>
        <SignMessage req={req} callback={callback}></SignMessage>
      </div>
    );
  } else {
    return (
      <div>
        <Stack spacing={2}>
        {connectors.map((connector) => (
          <Button
            variant="contained"
            disabled={!connector.ready}
            key={connector.id}
            onClick={() => connect({ connector })}
          >
            {connector.name}
            {!connector.ready && ' (unsupported)'}
            {isLoading &&
              connector.id === pendingConnector?.id &&
              ' (connecting)'}
          </Button>
        ))}
        </Stack>
        {error && <div>{error.message}</div>}
      </div>
    )
  }
}

export default RequestAccess;
