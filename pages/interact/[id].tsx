import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "../../components/connectWallet";
import SignMessage from "../../components/signMessage";
import Login from "../../components/magicLink/login";
import { withIronSessionSsr } from "iron-session/next";
import { generateChallenge } from "../../lib/auth";
import { sessionOptions } from "../../lib/session";
import objectPath from 'object-path';
import { useQRCode } from 'next-qrcode';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { FormControl } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import DoneIcon from '@mui/icons-material/Done';
import RepeatIcon from '@mui/icons-material/Repeat';

export default function Interact({ challenge }: { challenge: string }) {
  const [pageStatus, setPageStatus] = useState(true);
  const [pendingStatus, setPendingStatus] = useState(false);
  const [emailStatus, setEmailStatus] = useState(false);
  const [vcStatus, setVcStatus] = useState(false);
  const [vcType, setVcType] = useState("");
  const [docInstance, setDocInstance] = useState({});
  const [qrCode, setQrCode] = useState("");
  const [qrStatus, setQrStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const { query, isReady } = useRouter();
  const { Canvas } = useQRCode();
  
  const back = () => {
    setQrStatus(true);
  }

  const changeVcType = async(e: SelectChangeEvent<typeof vcType>) => {
    const {
      target: { value }
    } = e;
    setVcType(value);
    setLoading(true);
    if (value !== '') {
      const doc = docInstance;
      objectPath.set(doc, 'vc_type', value);
      setDocInstance(doc);
      const result = await fetch("/api/vp/share",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(doc) })
        .then((res) => res.json());
      setLoading(false);
      setQrCode(result.link);
      setQrStatus(true);
      var check = false
      while (!check) {
        await sleep(5);
        const a = await fetch("/api/vp/status",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: query.id}) })
        .then((res) => res.json());
        if (a.success) {
          check = true;
          setVcStatus(a.success);
        }
      }
    }
  }

  const getInstance = useCallback(async() => {
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
  },[query])

  const sleep = async(seconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  const finish = async() => {
    const body = {id: query.id, init: false};
    const finish = await fetch("/api/as/finish",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (finish.success && finish.success.state === 'approved') {
      window.location.replace(finish.success.interact.finish.uri + "?hash=" + finish.success.interact_finish_hash + "&interact_ref=" + finish.success.interact_nonce.value);
    } else {
      setPendingStatus(true);
      var test = false;
      setVcStatus(false);
      while (!test) {
        await sleep(5);
        const finish1 = await fetch("/api/as/finish",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
        .then((res) => res.json()); 
        if (finish1.success && finish1.success.state === 'approved') {
          test = true;
          window.location.replace(finish1.success.interact.finish.uri + "?hash=" + finish1.success.interact_finish_hash + "&interact_ref=" + finish1.success.interact_nonce.value);
        }
      }
    }
    if (finish.error) {
      setPageStatus(false);
    }
  }

  const repeat = () => {
    setVcType("");
    setQrCode("");
    setQrStatus(false);
    setVcStatus(false);
  }

  const setEmail = async(email: string) => {
    const doc = docInstance;
    objectPath.set(doc, 'email', email);
    setDocInstance(doc);
    const result = await fetch("/api/as/update",
    { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(doc) })
    .then((res) => res.json());
    if (result.success) {
      const body = {id: query.id, init: true};
      const finish = await fetch("/api/as/finish",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
      if (finish.success && finish.success.state === 'approved') {
        window.location.replace(finish.success.interact.finish.uri + "?hash=" + finish.success.interact_finish_hash + "&interact_ref=" + finish.success.interact_nonce.value);
      } else {
        getInstance();
        setEmailStatus(true);
      }
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
        <p>Interaction invalid</p>
      </div>
    );
  }

  if (pendingStatus) {
    return (
      <div>
        <h2>Awaiting approval from resource owner</h2>
      </div>
    );
  }

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
          <Login challenge={challenge} authonly={true} setEmail={setEmail}/>
        </div>
      </>
    );
  } else {
    if (!vcStatus) {
      if (!qrStatus) {
        if (!loading) {
          return (
            <div>
              <h2>Trustee Authorization Server</h2>
              <div>
                <Button variant="contained" onClick={finish} startIcon={<div><DoneIcon/></div>}>Finished Gathering Claims</Button>
                <h4>or Gather Verifiable Credentials:</h4>
                <p>First, make sure you have a <a href='https://github.com/Sphereon-Opensource/ssi-mobile-wallet' target='_blank'>Sphereon Verifiable Credentials Wallet</a> installed on your smartphone device.</p>
                <p>If you are a provider - go to <a href='https://dir.hieofone.org/doximity' target='_blank'>HIE of One-Doximity Verifieable Credentials Issuer</a> to generate a Verifiable Credential.</p>
                <p>Then select the Verifiable Credential type below:</p>
              </div>
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <FormControl sx={{ m: 1, width: 300 }}>
                  <InputLabel id="select-label">Verifiable Credential Type</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    value={vcType}
                    onChange={changeVcType}
                    input={<OutlinedInput label="Verifiable Credential Type" />}
                  >
                    <MenuItem value={''}>Select Credential...</MenuItem>
                    <MenuItem value={'NPI'}>NPI Credential</MenuItem>
                    <MenuItem value={'sphereon'}>Sphereon Wallet Identity Credential</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              </div>
            );
          } else {
            return (
              <div>
                <Box sx={{ display: 'flex' }}>
                  <CircularProgress />
                </Box>
              </div>
            )
          }
      } else {
        return (
          <div>
            <h4>Scan this QR code using  your Sphereon Wallet app to retrieve the Verifiable Credential:</h4>
            <Box sx={{ display: 'flex', flexDirection: 'row', py: 2 }}>
              <Canvas
                text={qrCode}
                options={{
                  errorCorrectionLevel: 'M',
                  margin: 3,
                  scale: 4,
                  width: 200
                }}
              />
            </Box>
            <Button variant="contained" onClick={back} startIcon={<div><ArrowBackIcon/></div>}>Back</Button>
          </div>
        )
      };
    } else {
      return (
        <div>
          <h2>Trustee Authorization Server</h2>
          <h3>Verifiable credential successfully added!  What would you like to do next?</h3>
          <Stack spacing={2}>
            <Button variant="contained" onClick={repeat} startIcon={<div><RepeatIcon/></div>}>Add another Verifiable Credential</Button>
            <Button variant="contained" onClick={finish} startIcon={<div><DoneIcon/></div>}>Finished Gathering Claims</Button>
          </Stack>
        </div>
      );
    }
  }
}

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
}) {
  // if (isLoggedIn(req)) {
  //   return {
  //     redirect: {
  //       destination: "/interact/",
  //       permanent: false,
  //     },
  //   };
  // }
  const challenge = generateChallenge();
  req.session.challenge = challenge;
  await req.session.save();
  return { props: { challenge } };
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