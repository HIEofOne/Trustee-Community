import { Fragment, MouseEvent, SyntheticEvent, useCallback, useEffect, useState } from 'react';
import objectPath from 'object-path';
import sortArray from 'sort-array';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Divider from '@mui/material/Divider';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Fab from '@mui/material/Fab';
import FolderIcon from '@mui/icons-material/Folder';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Policies(props:any) {
  // const [resources, setResources] = useState<{
  //   _id: any;
  //   privileges: any;
  //   [key: number]: any
  // }[]>([]);
  const [resources, setResources] = useState<[]>([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [notification, setNotification] = useState("");
  const [deleteValue, setDeleteValue] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(0);
  const [addPolicy, setAddPolicy] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addIndex, setAddIndex] = useState(0);
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [view, setView] = useState<string | null>('user');
  const [users, setUsers] = useState<{[key: number]: any}[]>([]);
  
  const addPolicyItem = async(docs:any, index:number, value:string) => {
    const privileges = objectPath.get(docs, index + '.privileges');
    privileges.push(value);
    objectPath.set(docs, index + '.privileges', privileges);
    const publicKey = await fetch("/api/as/jwks",
      { method: "GET", headers: {"Content-Type": "application/json"} })
      .then((res) => res.json()).then((json) => json.key);
    const body = {
      doc: {'access': docs[index],
        'resource_server': {
          'key': {
            'proof': 'httpsig',
            'jwk': publicKey
          }
        }
      },
      urlinput: '/api/as/resource',
      method: 'PUT',
      jwt: props.jwt
    };
    const update = await fetch("/api/as/sign",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (update.success) {
      setNotification('Privilege Updated');
      setOpenNotification(true);
      setResources(docs);
      calcUsers(docs);
      setAddPolicy(false);
    } else {
      setIsError(true);
      setError(update);
    }
  }

  const validate = (inputText: string) => {
    const emailRegex = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, "gm");
    return emailRegex.test(inputText);
  }

  const closeNotification = () => {
    setOpenNotification(false);
  }

  const calcUsers = useCallback((resources_result: any) => {
    const users: any[] = [];
    for (const resource of resources_result) {
      for (const privilege of objectPath.get(resource, 'privileges')) {
        if (privilege.indexOf('@') > -1) {
          if (privilege !== props.email) {
            const found = users.findIndex((user) => user.email === privilege)
            if (found > -1) {
              const resources_arr = objectPath.get(users, found + '.resources');
              resources_arr.push(resource);
              objectPath.set(users, found + '.resources', resources_arr);
            } else {
              const user = {
                email: privilege,
                resources: [resource]
              };
              users.push(user);
            }
          }
        }
      }
    }
    setUsers(users);
  },[props])

  const getResources = useCallback(async(filter="") => {
    const body = {email: props.email, filter: filter};
    const resources_result = await fetch("/api/as/resources",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    sortArray(resources_result, {by: 'type', order: 'asc'});
    setResources(resources_result);
    calcUsers(resources_result);
  }, [props, calcUsers]);

  const handleAddClick = async(value: string, index: number) => {
    setAddValue(value);
    setAddPolicy(true);
    setAddIndex(index);
    const docs = [...resources];
    await addPolicyItem(docs, index, value);
  }

  const handleAddPolicy = async(index: number) => {
    if (addPolicy === true) {
      if (addValue == '') {
        setAddPolicy(false);
      } else {
        if (validate(addValue)) {
          const docs = [...resources];
          await addPolicyItem(docs, index, addValue);
        } else {
          setIsError(true);
          setError('Email not valid');
        }
      }
    } else {
      setAddPolicy(true);
      setAddIndex(index);
    }
  }

  const handleAddValue = (e: any) => {
    setAddValue(e.target.value);
  }

  const handleClose = async(event: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    const doc: { [key: number]: any; } = resources[deleteIndex];
    const privileges: string[] = [];
    for (const b of objectPath.get(doc, 'privileges')) {
      if (b !== deleteValue) {
        privileges.push(b);
      }
    }
    objectPath.set(doc, 'privileges', privileges);
    const publicKey = await fetch("/api/as/jwks",
      { method: "GET", headers: {"Content-Type": "application/json"} })
      .then((res) => res.json()).then((json) => json.key);
    const body = {
      doc: {'access': doc,
        'resource_server': {
          'key': {
            'proof': 'httpsig',
            'jwk': publicKey
          }
        }
      },
      urlinput: '/api/as/resource',
      method: 'PUT',
      jwt: props.jwt
    };
    const update = await fetch("/api/as/sign",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (update.success) {
      setOpen(false);
      objectPath.set(resources, deleteIndex, doc);
      setResources(resources);
      calcUsers(resources);
    } else {
      setIsError(true);
      setError(update);
    }
  };

  const handleDeleteResource = (resource: any, email: string) => {
    const index = resources.findIndex((item) => objectPath.get(item, '_id') === resource._id)
    setDeleteValue(email);
    setDeleteIndex(index);
    setOpen(true);
  }

  const handleDeletePolicy = (value: string, index: number) => {
    if (value !== objectPath.get(resources, index + '.ro')) {
      setDeleteValue(value);
      setDeleteIndex(index);
      setOpen(true);
    } else {
      setNotification('Resource owner cannot be removed from privileges!');
      setOpenNotification(true);
    }
  }

  const handleFilter = (e: any) => {
    setFilter(e.target.value);
  }

  const handleAllResources = async(email: string, read_only_arr: string[]) => {
    const resources_edit = resources;
    for (const i in resources_edit) {
      if (objectPath.get(resources_edit, i + '.actions').join() === read_only_arr.join()) {
        if (objectPath.get(resources_edit, i + '.privileges').findIndex((item: any) => item === email) === -1) {
          const privileges = objectPath.get(resources_edit, i + '.privileges');
          privileges.push(email);
          objectPath.set(resources_edit, i + '.privileges', privileges);
          const publicKey = await fetch("/api/as/jwks",
            { method: "GET", headers: {"Content-Type": "application/json"} })
            .then((res) => res.json()).then((json) => json.key);
          const body = {
            doc: {'access': resources_edit[i],
              'resource_server': {
                'key': {
                  'proof': 'httpsig',
                  'jwk': publicKey
                }
              }
            },
            urlinput: '/api/as/resource',
            method: 'PUT',
            jwt: props.jwt
          };
          const update = await fetch("/api/as/sign",
            { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
            .then((res) => res.json());
          if (!update.success) {
            setIsError(true);
            setError(update);
          }
        }
      }
    }
    setResources(resources_edit);
    calcUsers(resources_edit);
    setNotification('Privileges Updated');
    setOpenNotification(true);
  }

  const handleRemoveAllResources = async(email: string) => {
    const resources_edit = resources;
    for (const i in resources_edit) {
      if (objectPath.get(resources_edit, i + '.privileges').findIndex((item: any) => item === email) > -1) {
        const privileges: string[] = [];
        for (const b of objectPath.get(resources_edit, i + '.privileges')) {
          if (b !== email) {
            privileges.push(b);
          }
        }
        objectPath.set(resources_edit, i + '.privileges', privileges);
        const publicKey = await fetch("/api/as/jwks",
          { method: "GET", headers: {"Content-Type": "application/json"} })
          .then((res) => res.json()).then((json) => json.key);
        const body = {
          doc: {'access': resources_edit[i],
            'resource_server': {
              'key': {
                'proof': 'httpsig',
                'jwk': publicKey
              }
            }
          },
          urlinput: '/api/as/resource',
          method: 'PUT',
          jwt: props.jwt
        }
        const update = await fetch("/api/as/sign",
          { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
          .then((res) => res.json());
        if (!update.success) {
          setIsError(true);
          setError(update);
        }
      }
    }
    setResources(resources_edit);
    calcUsers(resources_edit);
    setNotification('Privileges Updated');
    setOpenNotification(true);
  }

  const handleUndo = () => {
    setOpen(false);
  }

  const handleView = (event: MouseEvent<HTMLElement>, newView: string | null,) => {
    setView(newView);
  }

  const action = (
    <Fragment>
      <Button color="primary" size="small" onClick={handleUndo}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      getResources(filter).catch(console.error);
    }, 500)
    return () => {
      clearTimeout(handler)
    }
  },[getResources, filter]);

  return (
    <div>
      <h2>My Resources and Policies</h2>
      <ul>
        <li>
          You currently have {resources ? resources.length : 0} resources.
        </li>
        <li>
          You currently have {users ? users.length : 0} invited users.
        </li>
      </ul>
      <Box>
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={handleView}
        aria-label="view"
      >
        <ToggleButton value="resource" aria-label="resource">
          Resource View
        </ToggleButton>
        <ToggleButton value="user" aria-label="user">
          User View
        </ToggleButton>
      </ToggleButtonGroup>
      </Box>
      <Box>
        <TextField
          label="Filter"
          sx={{ m: 1, width: '25ch' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
            autoFocus: true
          }}
          variant="standard"
          onChange={(e) => handleFilter(e)}
        />
      </Box>
      {view === 'resource' ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', pt: 2 }}>
          {
            resources.map((value: any, index: number) => {
              return <Card sx={{ margin: 2, maxWidth: 450 }} key={index}>
                <CardContent>
                  <Typography variant="h5" component="div" sx={{ pb: 2 }}>{value.type}</Typography>
                  <Box sx={{ pb:2 }}>
                    <Typography variant="h6" component="div">Actions</Typography>
                    <Stack direction="row" spacing={1}>
                    {
                      value.actions.map((value0: string, index0: number) => {
                        {
                          if (value0 === 'read') {
                            return <Chip icon={<VisibilityIcon/>} label={value0} key={index0}/>
                          }
                          if (value0 === 'write') {
                            return <Chip icon={<EditIcon/>} label={value0} key={index0}/>
                          }
                          if (value0 === 'delete') {
                            return <Chip icon={<DeleteIcon/>} label={value0} key={index0}/>
                          }
                        }
                      })
                    }
                    </Stack>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', pb: 2 }}>
                    <Typography variant="h6" component="div">Locations</Typography>
                    {
                      value.locations.map((value1: string, index1:number) => {
                        return <Link variant="subtitle2" color="text.primary" key={index1} href={value1} target="_blank" rel="noopener">{value1}</Link>
                      })
                    }
                  </Box>
                  <Typography variant="h6" component="div">Policies</Typography>
                  {
                    value.privileges.map((value2: string, index2: number) => {
                      return <Box sx={{ pb:1 }} key={index2}><Chip icon={<PersonIcon/>} label={value2} onDelete={() => handleDeletePolicy(value2, index)}/></Box>
                    })
                  }
                  <div style={{ textAlign: "right" }}>
                    <Box sx={{ pb:2 }}>
                      {addPolicy && addIndex === index ? (<span><TextField onChange={(e) => handleAddValue(e)} id="standard-basic" label="Email Address" variant="standard" error={isError} helperText={error}/></span>) : (<span></span>)}  
                      <Fab size="small" color="primary" aria-label="add" onClick={() => handleAddPolicy(index)}>
                        <AddIcon />
                      </Fab>
                    </Box>
                    <Box>
                      {addPolicy && addIndex === index && !value.privileges.includes('npi') ? (
                        <Chip icon={<AddIcon/>} label="npi" sx={{ mr:1 }} onClick={() => handleAddClick('npi', index)}/>) : (<></>)}
                      {addPolicy && addIndex === index && !value.privileges.includes('offline') ? (
                        <Chip icon={<AddIcon/>} label="offline" sx={{ mr:1 }} onClick={() => handleAddClick('offline', index)}/>) : (<></>)}
                    </Box>
                  </div>
                </CardContent>
                
                <CardActions disableSpacing>
                  
                </CardActions>
              </Card>
            })
          }
        </Box>
      ):(
        <Stack spacing={1} sx={{mt:2}}>
          {
            users.map((value: any, index: number) => {
              return <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Avatar sx={{ mr:2 }}></Avatar>
                  <Typography>{value.email}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    <Button variant="contained" color='success' startIcon={<AddIcon />} onClick={() => handleAllResources(value.email, ['read', 'write', 'delete'])}>
                      Read, Write, and Delete for All Resources
                    </Button>
                    <Button variant="contained" color='primary' startIcon={<AddIcon />} onClick={() => handleAllResources(value.email, ['read'])}>
                      Read Only for All Resources
                    </Button>
                    <Button variant="contained" color='error' startIcon={<CloseIcon />} onClick={() => handleRemoveAllResources(value.email)}>
                      Remove Access to All Resources
                    </Button>
                  </Stack>
                  <List dense>
                    {
                      value.resources.map((value1: any, index1: number) => {
                        return <div key={index1}>
                          <ListItem 
                            secondaryAction={
                              <IconButton aria-label="delete" onClick={() => handleDeleteResource(value1, value.email)}>
                                <DeleteIcon/>
                              </IconButton>
                            }
                            >
                            <ListItemIcon>
                              <FolderIcon />
                            </ListItemIcon>
                            {
                              value1.actions.map((value2: string, index2: number) => {
                                {
                                  if (value2 === 'read') {
                                    return <Chip icon={<VisibilityIcon/>} label={value2} key={index2}/>
                                  }
                                  if (value2 === 'write') {
                                    return <Chip icon={<EditIcon/>} label={value2} key={index2}/>
                                  }
                                  if (value2 === 'delete') {
                                    return <Chip icon={<DeleteIcon/>} label={value2} key={index2}/>
                                  }
                                }
                              })
                            }
                            <ListItemText
                              primary={value1.type}
                              sx={{ml:2}}
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </div>
                      })
                    }
                  </List>
                </AccordionDetails>
              </Accordion>
            })
          }
        </Stack>
      )}
      <Stack spacing={2} direction="row" sx={{mt:2}}>
        <Button variant="contained" onClick={() => props.changePage("dashboard")}>
          Back
        </Button>
      </Stack>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Policy removed"
        action={action}
      />
      <Snackbar
        open={openNotification}
        autoHideDuration={3000}
        onClose={closeNotification}
        message={notification}
      />
    </div>
  );
}