import { useCallback, useEffect, useState } from 'react';
import objectPath from 'object-path';
import sortArray from 'sort-array';

import Box from '@mui/material/Box';
import BlockIcon from '@mui/icons-material/Block';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DoneIcon from '@mui/icons-material/Done';
import EditIcon from '@mui/icons-material/Edit';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Pending(props:any) {
  const [requests, setRequests] = useState<{[key: number]: any}[]>([]);
  const [openNotification, setOpenNotification] = useState(false);
  const [notification, setNotification] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [vcInstance, setVcInstance] = useState<{[key: string]: any}>([]);
  
  const approve = async(id: string, type: string, index: number, email: string, gnap_id: string) => {
    const doc = {
      id: id,
      privilege: email,
      doc_id: gnap_id,
      pending_resource_index: index
    };
    const body = {
      doc: doc,
      urlinput: '/api/as/approve',
      method: 'POST'
    };
    const approve = await fetch("/api/as/sign",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (approve.success) {
      setNotification('Privilege request approved for ' + email + ' for the ' +  type + ' resource.');
      setOpenNotification(true);
      getRequests();
    }
    if (approve.error) {
      setNotification('Error with action');
      setOpenNotification(true);
    }
  }
  const decline = async(id: string, type: string, index: number, email: string, gnap_id: string) => {
    const body = {
      id: id,
      privilege: email,
      doc_id: gnap_id,
      pending_resource_index: index
    };
    const decline = await fetch("/api/as/decline",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (decline.success) {
      setNotification('Privilege request denied for ' + email + ' for the ' + type + ' resource.');
      setOpenNotification(true);
      getRequests();
    }
    if (decline.error) {
      setNotification('Error with action');
      setOpenNotification(true);
    }
  }
  const closeModal = () => {
    setOpenModal(false);
  }
  const closeNotification = () => {
    setOpenNotification(false);
  }
  const getRequests = useCallback(async() => {
    const body = {email: props.email};
    const pending_resources = await fetch("/api/as/pending",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    sortArray(pending_resources.response.docs, {by: 'reqeust_date', order: 'asc'});
    setRequests(pending_resources.response.docs);
  }, [props]);
  const getUser = async(index: number) => {
    const vc_arr = []
    if (objectPath.has(requests, index + '.vc')) {
      for (const vc of objectPath.get(requests, index + '.vc')) {
        vc_arr.push(objectPath.get(vc, 'vc.credentialSubject'))
      }
    } else {
      vc_arr.push({'Credentials': 'None presented'})
    }
    setVcInstance(vc_arr);
    setOpenModal(true);
  }
  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
  };

  useEffect(() => {
    getRequests().catch(console.error);
  },[getRequests]);

  return (
    <div>
      <h2>My Pending Requests</h2>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', pt: 2 }}>
      {
        requests.map((value0: any, index0: number) => {
          return <div key={index0}>
            {
              value0.pending_resources.map((value: any, index: number) => {
                return <Card sx={{ width: "100%", margin: 2 }} key={index}>
                  <CardContent>
                    <Typography variant="h5" component="div" sx={{ pb: 2 }}>{value.type}</Typography>
                    <Box sx={{ pb:2 }}>
                      <Typography variant="h6" component="div">Requesting User</Typography>
                      <Typography variant="subtitle1" component="div"><Link href="#" onClick={() => getUser(index0)}>{value0.email}</Link></Typography>
                    </Box>
                    <Box sx={{ pb:2 }}>
                      <Typography variant="h6" component="div">Actions</Typography>
                      <Stack direction="row" spacing={1}>
                        {
                          value.actions.map((value1: string, index1: number) => {
                            {
                              if (value1 === 'read') {
                                return <Chip icon={<VisibilityIcon/>} label={value1} key={index1}/>
                              }
                              if (value1 === 'write') {
                                return <Chip icon={<EditIcon/>} label={value1} key={index1}/>
                              }
                              if (value1 === 'delete') {
                                return <Chip icon={<DeleteIcon/>} label={value1} key={index1}/>
                              }
                            }
                          })
                        }
                      </Stack>
                    </Box>
                    <Box sx={{ pb:2 }}>
                      <Typography variant="h6" component="div">Locations</Typography>
                      {
                        value.locations.map((value2: string, index2: number) => {
                          return <Typography variant="subtitle1" color="text.primary" key={index2} component="div">{value2}</Typography>
                        })
                      }
                    </Box>
                    <Typography variant="h6" component="div">Policies</Typography>
                    {
                      value.privileges.map((value3: string, index3: number) => {
                        return <Box sx={{ pb:1 }} key={index3}><Chip icon={<PersonIcon/>} label={value3} /></Box>
                      })
                    }
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary" onClick={() => approve(value._id, value.type, index, value0.email, value0._id)} startIcon={<div><DoneIcon/></div>}>Approve</Button>
                    <Button size="small" color="primary" onClick={() => decline(value._id, value.type, index, value0.email, value0._id)} startIcon={<div><BlockIcon/></div>}>Decline</Button>
                  </CardActions>
                </Card>
              })
            }
          </div>
        })
      }
      </Box>
      <Stack spacing={2} direction="row">
        <Button variant="contained" onClick={() => props.changePage("dashboard")}>
          Back
        </Button>
      </Stack>
      <Snackbar
        open={openNotification}
        autoHideDuration={3000}
        onClose={closeNotification}
        message={notification}
      />
      <Dialog
        open={openModal}
        onClose={closeModal}
      >
        <Box>
          { vcInstance.map((value3: object, index3: number) => {
            return <List key={index3}>
              {Object.entries(value3).map(([key, value], index4: number) => (  
                <ListItem key={index4}><ListItemText primary={key} secondary={value} /></ListItem>
              ))}
            </List>
          })}
        </Box>
      </Dialog>
    </div>
  );
}