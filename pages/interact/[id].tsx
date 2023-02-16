import Head from 'next/head';
import { Magic } from "magic-sdk";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "../../components/connectWallet";
import SignMessage from "../../components/signMessage";
import moment from "moment";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export default function Interact() {
  const [pageStatus, setPageStatus] = useState(true);
  const [emailStatus, setEmailStatus] = useState(false);
  const [docInstance, setDocInstance] = useState({});
  const [patient, setPatient] = useState("");
  const [scope, setScope] = useState("");
  const [purpose, setPurpose] = useState("");
  const [credential, setCredential] = useState("");
  const [request, setRequest] = useState("");
  const [resourceType, setResourceType] = useState<string[]>([]);
  const [resourceDate, setResourceDate] = useState(new Date());
  const [nextReady, setNextReady] = useState(true);
  const { query, isReady } = useRouter();
  
  const getInstance = async() => {
    const body = {id: query.id};
    const isInstance = await fetch("/api/as/instance",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (isInstance.success) {
      setDocInstance(isInstance.success);
    }
    if (isInstance.error) {
      setPageStatus(false);
    }
  }
  
  const getResource = async() => {
    const body = {doc: docInstance};
    const isResource = await fetch("/api/as/resourceExists",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (isResource.success) {
      
    }
    if (isResource.error) {

    }
  }

  useEffect(() => {
    console.log(isReady)
    if (isReady) {
      getInstance();
    }
  },[isReady])

  if (!pageStatus) {
    return (
      <div>
        <p>Session invalid</p>
      </div>
    );
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (typeof window === "undefined") return;
    const { elements } = event.target;
    const magicKey = await fetch("/api/magicLink/key", 
      { method: "POST" });
    var magicKeyData = await magicKey.json();
    const did = await new Magic(magicKeyData.key).auth.loginWithMagicLink({ email: elements.email.value });
    // Once we have the did from magic, login with our own API
    const authRequest = await fetch("/api/magicLink/login", 
      { method: "POST", headers: { Authorization: `Bearer ${did}` }});
    if (authRequest.ok) {
      // Magic Link login successful!
      console.log(did)
      setEmailStatus(true);
      setDocInstance({
        ...docInstance,
        ['email']: elements.email.value,
        ['did']: did
      });
      getResource();
    } else {
      /* handle errors */
    }
  };
  const generateRequest = () => {
    var request = `
Details of request:    
Patient: ${patient}
Scope: ${scope}
Purpose: ${purpose}`;
    setRequest(request);
    return [patient, scope, purpose];
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
          date: moment(resourceDate).format('MM/DD/YYYY')
        }
      }
    };
    if (data) {
      console.log(data)
      console.log(body)
    //   await fetch("/api/couchdb/requests/new", 
    //     { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
    //     .then((res) => res.json()).then((json) => console.log(json));
    }
  };
  
  if (!emailStatus) {
    return (
      <>
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
            if (document.cookie && document.cookie.includes('authed')) {
              window.location.href = "/myTrustee/dashboard"
            }
          `,
            }}
          />
        </Head>
        <div>
          <h2>Trustee Authorization Server</h2>
          <Box
              component="form"
              sx={{
                '& .MuiTextField-root': { m: 1, width: '25ch' },
              }}
              noValidate
              autoComplete="off"
              onSubmit={handleSubmit}
            >
              <p>Login</p>
              <TextField name="email" type="email" placeholder="Email Address" variant="standard"/>
              <Button variant="contained" type="submit">Submit</Button>
            </Box>
        </div>
      </>
    );
  } else {
    return (
      <div>
        <h2>Trustee Authorization Server</h2>
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
      </div>
    );
  }
  
}

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