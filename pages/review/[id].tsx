import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { getIronSession } from 'iron-session';
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { SessionData, sessionOptions } from '../../lib/session';
import objectPath from 'object-path';
import Image from 'next/image';
import siwePic from '../../public/siwe.webp';
import { SiweMessage } from '@spruceid/ssx';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import BlockIcon from '@mui/icons-material/Block';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Review({
  session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [pageStatus, setPageStatus] = useState(false);
  const [docInstance, setDocInstance] = useState<{[key: string]: any}>({});
  const [openNotification, setOpenNotification] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [notification, setNotification] = useState("");
  const [vcInstance, setVcInstance] = useState<{[key: string]: any}>([]);
  const [verified, setVerified] = useState(false);
  const { query, isReady } = useRouter();

  const approve = async(id: string, type: string, index: number) => {
    const doc = {
      id: id,
      privilege: docInstance.email,
      doc_id: docInstance._id,
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
      setNotification('Privilege request approved for ' + docInstance.email + ' for the ' +  type + ' resource.');
      setOpenNotification(true);
      getInstance();
    }
    if (approve.error) {
      setPageStatus(false);
    }
  }
  
  const closeModal = () => {
    setOpenModal(false);
  }

  const closeNotification = () => {
    setOpenNotification(false);
  }

  const getInstance = useCallback(async() => {
    const body = {id: query.id};
    const isInstance = await fetch("/api/as/instance",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (isInstance.success) {
      if (objectPath.has(isInstance, 'success.pending_resources')) {
        setPageStatus(true);
        setDocInstance(isInstance.success);
        const vc_arr = []
        if (objectPath.has(isInstance, 'success.vc')) {
          for (const vc of objectPath.get(isInstance, 'success.vc')) {
            vc_arr.push(objectPath.get(vc, 'vc.credentialSubject'))
          }
        } else {
          vc_arr.push({'Credentials': 'None presented'})
        }
        setVcInstance(vc_arr);
        if (objectPath.has(isInstance, 'success.siwe')) {
          try {
            const siweMessage = new SiweMessage(objectPath.get(isInstance, 'success.siwe.message'))
            const status = await siweMessage.verify({signature: objectPath.get(isInstance, 'success.siwe.sig')})
            if (status) {
              setVerified(true);
            }
          } catch (e) {
            console.log(e)
          }
        }
      }
    }
    if (isInstance.error) {
      setPageStatus(false);
    }
  },[query])

  const decline = async(id: string, type: string, index: number) => {
    const body = {
      id: id,
      privilege: docInstance.email,
      doc_id: docInstance._id,
      pending_resource_index: index
    };
    const decline = await fetch("/api/as/decline",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (decline.success) {
      setNotification('Privilege request denied for ' + docInstance.email + ' for the ' + type + ' resource.');
      setOpenNotification(true);
      getInstance();
    }
    if (decline.error) {
      setPageStatus(false);
    }
  }

  useEffect(() => {
    if (isReady) {
      getInstance().catch(console.error);
    }
  },[isReady, getInstance]);

  if (!pageStatus) {
    return (
      <div>
        <p>Page invalid</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Trustee Authorization Server</h2>
      <h3>Review the following privilege requests from <Link href="#" onClick={() => setOpenModal(true)}>{docInstance.email}</Link>:</h3>
      { verified ? (
        <Container sx={{height:50}}>
          <Image src={siwePic} alt="me" height="50"></Image>
          <VerifiedIcon color="success" fontSize="large" sx={{ ml:3 }}></VerifiedIcon>
        </Container>
      ) : (
        <></>
      ) }
      <Box sx={{ display: 'flex', flexWrap: 'wrap', pt: 2 }}>
        {
          docInstance.pending_resources.map((value: any, index: number) => {
          return <Card sx={{ width: "100%", margin: 2 }} key={index}>
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
              <Box sx={{ pb:2 }}>
                <Typography variant="h6" component="div">Locations</Typography>
                {
                  value.locations.map((value1: string, index1: number) => {
                    return <Typography variant="subtitle1" color="text.primary" key={index1} component="div">{value1}</Typography>
                  })
                }
              </Box>
              <Typography variant="h6" component="div">Policies</Typography>
              {
                value.privileges.map((value2: string, index2: number) => {
                  return <Box sx={{ pb:1 }} key={index2}><Chip icon={<PersonIcon/>} label={value2} /></Box>
                })
              }
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={() => approve(value._id, value.type, index)} startIcon={<div><DoneIcon/></div>}>Approve</Button>
              <Button size="small" color="primary" onClick={() => decline(value._id, value.type, index)} startIcon={<div><BlockIcon/></div>}>Decline</Button>
            </CardActions>
          </Card>
        })}
      </Box>
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

// export const getServerSideProps = withIronSessionSsr(async function ({
//   req,
//   res,
//   resolvedUrl
// }) {
//   if (!isLoggedIn(req)) {
//     return {
//       redirect: {
//         destination: `/?from=${encodeURIComponent(resolvedUrl)}`,
//         permanent: false,
//       },
//     };
//   }
//   return {
//     props: {
//       userId: req.session.userId ?? null
//     }
//   };
// },
// sessionOptions);
export const getServerSideProps = (async (context) => {
  const session = await getIronSession<SessionData>(
    context.req,
    context.res,
    sessionOptions,
  );
  if (!session.isLoggedIn) {
    return {
      redirect: {
        destination: `/?from=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return { props: { session } };
}) satisfies GetServerSideProps<{
  session: SessionData;
}>;

