import { useCallback, useEffect, useState } from "react";
import objectPath from 'object-path';
import { useQRCode } from 'next-qrcode';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DoneIcon from '@mui/icons-material/Done';
import { FormControl } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import PageviewIcon from '@mui/icons-material/Pageview';
import RepeatIcon from '@mui/icons-material/Repeat';
import Stack from '@mui/material/Stack';
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function Credentials(props:any) {
  const [pendingStatus, setPendingStatus] = useState(false);
  const [vcStatus, setVcStatus] = useState(false);
  const [vcType, setVcType] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [qrStatus, setQrStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [vcInstance, setVcInstance] = useState<{[key: string]: any}>([]);
  const { Canvas } = useQRCode();
  
  const back = () => {
    setQrStatus(false);
  }

  const changeVcType = async(e: SelectChangeEvent<typeof vcType>) => {
    const {
      target: { value }
    } = e;
    setVcType(value);
    setLoading(true);
    if (value !== '') {
      const doc = props.doc;
      objectPath.set(doc, 'vc_type', value);
      const result = await fetch("/api/vp/share",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(doc) })
        .then((res) => res.json());
      objectPath.set(doc, '_rev', result.rev);
      props.update_doc(doc);
      setLoading(false);
      setQrCode(result.link);
      setQrStatus(true);
      let check = false;
      let a = {};
      while (!check) {
        await sleep(5);
        a = await fetch("/api/vp/status",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: props.id}) })
        .then((res) => res.json());
        if (objectPath.get(a, 'success', true)) {
          check = true;
        }
      }
      if (objectPath.get(a, 'success', true)) {
        await load();
        setVcStatus(true);
      }
    }
  }

  const closeModal = () => {
    setOpenModal(false);
  }

  const finish = async() => {
    if (props.interact) {
      const body = {id: props.id, init: false};
      const finish_result = await fetch("/api/as/finish",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
        .then((res) => res.json());
      if (finish_result.success && finish_result.success.state === 'approved') {
        setLoading(true);
        window.location.replace(finish_result.success.interact.finish.uri + "?hash=" + finish_result.success.interact_finish_hash + "&interact_ref=" + finish_result.success.interact_nonce.value);
      } else {
        setPendingStatus(true);
        let test = false;
        setVcStatus(false);
        while (!test) {
          await sleep(5);
          const finish_result1 = await fetch("/api/as/finish",
          { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
          .then((res) => res.json()); 
          if (finish_result1.success && finish_result1.success.state === 'approved') {
            test = true;
            setLoading(true);
            window.location.replace(finish_result1.success.interact.finish.uri + "?hash=" + finish_result1.success.interact_finish_hash + "&interact_ref=" + finish_result1.success.interact_nonce.value);
          }
        }
      }
      if (finish_result.error) {
        props.notification("error")
      }
    } else {
      props.close("close")
    }
  }

  const repeat = () => {
    setVcType("");
    setQrCode("");
    setQrStatus(false);
    setVcStatus(false);
  }

  const sleep = async(seconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  const load = useCallback(async() => {
    const body = {email: props.email, id: props.id};
    const vcs = await fetch("/api/vp/load",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (objectPath.has(vcs, 'doc')) {
      props.update_doc(objectPath.get(vcs, 'doc'));
    }
    const vc_arr = []
    if (objectPath.has(vcs, 'vc')) {
      for (const vc of objectPath.get(vcs, 'vc')) {
        vc_arr.push(objectPath.get(vc, 'vc.credentialSubject'))
      }
    } else {
      vc_arr.push({'Credentials': 'None presented'})
    }
    setVcInstance(vc_arr);
  }, [props]);

  useEffect(() => {
      load().catch(console.error);
  },[load]);

  if (pendingStatus) {
    return (
      <div>
        <h2>Awaiting approval from resource owner</h2>
      </div>
    );
  }
  
  if (!vcStatus) {
    if (!qrStatus) {
      return (
        <div>
          <h2>Trustee Authorization Server</h2>
          <div>
            <Stack spacing={2}>
              <Button variant="contained" onClick={() => setOpenModal(true)} startIcon={<div><PageviewIcon/></div>}>View Gathered Credentials</Button>
              <Button variant="contained" onClick={finish} startIcon={<div><DoneIcon/></div>}>Finished Gathering Credentials</Button>
            </Stack>
            <h4>or Gather Verifiable Credentials:</h4>
            <p>First, make sure you have a <a href='https://talao.io/talao-wallet/' target='_blank'>Talao Credentials Wallet</a> installed on your smartphone device.</p>
            <p>If you are a provider - go to <a href='https://dir.hieofone.org/doximity' target='_blank'>HIE of One-Doximity Verifiable Credentials Issuer</a> to generate a Verifiable Credential.</p>
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
                <MenuItem value={'Email'}>Proof of Email Credential</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <CircularProgress />
          </Backdrop>
        </div>
      );
    } else {
      return (
        <div>
          <h4>Scan this QR code using your <Link href="https://talao.io/talao-wallet/" target="_blank">Talao</Link> app to retrieve the Verifiable Credential:</h4>
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
          <Box sx={{ display: 'flex', flexDirection: 'row', py: 2 }}>
            <Link href={qrCode}>If QR Code is not readable, click here.</Link>
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