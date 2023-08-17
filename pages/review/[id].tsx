import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "../../components/connectWallet";
import SignMessage from "../../components/signMessage";
import { withIronSessionSsr } from "iron-session/next";
import { isLoggedIn } from "../../lib/auth";
import { sessionOptions } from "../../lib/session";
import objectPath from 'object-path';

import Box from '@mui/material/Box';
import BlockIcon from '@mui/icons-material/Block';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Link from '@mui/material/Link';
import Modal from '@mui/material/Modal';
import PersonIcon from '@mui/icons-material/Person';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Review() {
  const [pageStatus, setPageStatus] = useState(false);
  const [docInstance, setDocInstance] = useState<{[key: string]: any}>({});
  const [openNotification, setOpenNotification] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [notification, setNotification] = useState("");
  const [vcInstance, setVcInstance] = useState<{[key: string]: any}>([]);
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
        console.log(isInstance.success)
        setDocInstance(isInstance.success);
        const vc_arr = []
        if (objectPath.has(isInstance, 'success.vc')) {
          for (var vc of objectPath.get(isInstance, 'success.vc')) {
            vc_arr.push(objectPath.get(vc, 'vc.credentialSubject'))
          }
        } else {
          vc_arr.push({'Credentials': 'None presented'})
        }
        setVcInstance(vc_arr);
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
  
  return (
    <div>
      <h2>Trustee Authorization Server</h2>
      <h3>Review the following privilege requests from <Link href="#" onClick={() => setOpenModal(true)}>{docInstance.email}</Link>:</h3>
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
      <Modal
        open={openModal}
        onClose={closeModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          { vcInstance.map((value3: object, index3: number) => {
            return <ul key={index3}>
              {Object.entries(value3).map(([key, value], index4: number) => (  
                <li key={index4}>{key}: {value}</li>
              ))}
            </ul>
          })}
        </Box>
      </Modal>
    </div>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
  resolvedUrl
}) {
  if (!isLoggedIn(req)) {
    return {
      redirect: {
        destination: `/?from=${encodeURIComponent(resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      userId: req.session.userId ?? null
    }
  };
},
sessionOptions);

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