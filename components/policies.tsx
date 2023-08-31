import { Fragment, useCallback, useEffect, useState } from 'react';
import objectPath from 'object-path';
import sortArray from 'sort-array';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Policies(props:any) {
  const [resources, setResources] = useState<{[key: number]: any}[]>([]);
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
  
  const addPolicyItem = async(docs:any, index:number, value:string) => {
    const privileges = objectPath.get(docs, index + '.privileges');
    privileges.push(value);
    objectPath.set(docs, index + '.privileges', privileges);
    const body = {
      doc: {resource: docs[index]},
      urlinput: '/api/as/resource',
      method: 'PUT',
      jwt: props.jwt
    };
    const update = await fetch("/api/as/sign",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (update.success) {
      setNotification('Privilege Updated')
      setOpenNotification(true);
      setResources(docs);
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

  const getResources = useCallback(async(filter="") => {
    const body = {email: props.email, filter: filter};
    const resources = await fetch("/api/as/resources",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    sortArray(resources, {by: 'type', order: 'asc'});
    setResources(resources);
  }, [props]);

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
          await addPolicyItem(docs, index, addValue)
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

  const handleClose = async(event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    const doc: { [key: number]: any; } = resources[deleteIndex];
    const privileges: string[] = [];
    for (var b of objectPath.get(doc, 'privileges')) {
      if (b !== deleteValue) {
        privileges.push(b);
      }
    }
    objectPath.set(doc, 'privileges', privileges);
    const body = {
      doc: {resource: doc},
      urlinput: '/api/as/resource',
      method: 'PUT',
      jwt: props.jwt
    }
    const update = await fetch("/api/as/sign",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (update.success) {
      setOpen(false);
      objectPath.set(resources, deleteIndex, doc);
      setResources(resources);
    } else {
      setIsError(true);
      setError(update);
    }
  };

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

  const handleUndo = () => {
    setOpen(false);
  }

  const handleFilter = (e: any) => {
    setFilter(e.target.value);
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
      </ul>
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
                    return <Typography variant="subtitle2" color="text.primary" key={index1} component="div">{value1}</Typography>
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
      <Stack spacing={2} direction="row">
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