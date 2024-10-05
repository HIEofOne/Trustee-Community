import { useRouter } from 'next/router';
import { supported, create, get, parseCreationOptionsFromJSON, parseRequestOptionsFromJSON } from '@github/webauthn-json/browser-ponyfill';
import moment from 'moment';
import { useEffect, useState } from 'react';
import objectPath from 'object-path';
import { usePageVisibility } from 'react-page-visibility';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Fingerprint from '@mui/icons-material/Fingerprint';
import Grid from "@mui/material/Grid";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import KeyIcon from '@mui/icons-material/Key';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Login({ challenge, clinical=false, authonly=false, client='', setEmail, locations=[] }: { challenge: string, clinical: boolean, authonly: boolean, client?: string, setEmail?: any, locations?: any }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [register, setRegister] = useState(false);
  const [progress, setProgress] = useState("");
  const [email, setEmailValue] = useState("");
  const [clientExist, setClientExist] = useState(false);
  const [isContinue, setContinue] = useState(false);
  const isVisible = usePageVisibility();

  useEffect(() => {
    const checkAvailability = async () => {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsAvailable(available && supported());
    };
    checkAvailability();
    if (client !== '') {
      setClientExist(true)
    }
    if (localStorage.getItem('expires') !== null) {
      if (moment().unix() > Number(localStorage.getItem('expires'))) {
        localStorage.removeItem('email');
        localStorage.removeItem('nonce');
        localStorage.removeItem('expires');
      }
    }
    if (localStorage.getItem('email') !== null) {
      setEmailValue(localStorage.getItem('email') || '');
      setContinue(true);
    }
  }, [client]);

  const createPassKey = async () => {
    if (email !== '') {
      if (validate(email)) {
        // Check if user has an account
        localStorage.setItem('email', email);
        setIsChecking(true);
        const isRegistered = await fetch("/api/couchdb/patients/" + email,
          { method: "GET", headers: {"Content-Type": "application/json"} })
          .then((res) => res.json()).then((json) => json._id);
        let nonce = '';
        if (localStorage.getItem('nonce') === null || localStorage.getItem('nonce') === '') {
          const create = await fetch("/api/auth/create",
            { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: email} )})
          .then((res) => res.json());
          nonce = create.nonce;
          localStorage.setItem('nonce', nonce);
          localStorage.setItem('expires', create.expires)
        } else {
          nonce = localStorage.getItem('nonce') || '';
        }
        let check = false;
        let proceed = false;
        let timer = 0;
        while (!check) {
          if (timer < 230) {
            await sleep(5);
            const nonce_check = await fetch("/api/auth/check",
              { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({nonce: nonce}) })
            .then((res) => res.json());
            if (nonce_check.success) {
              check = true;
              proceed = true;
            }
            timer++;
          } else {
            check = true;
            localStorage.removeItem('nonce');
            localStorage.removeItem('expires');
          }
        }
        if (proceed) {
          localStorage.removeItem('email');
          localStorage.removeItem('nonce');
          localStorage.removeItem('expires');
          await fetch("/api/magicLink/login", 
            { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: email}) });
          if (isRegistered === undefined) {
            const body = { email: email };
            const data = await fetch(`/api/couchdb/patients/new`, 
              { method: "POST", headers : {"Content-Type": "application/json"}, body: JSON.stringify(body) })
              .then((res) => res.json());
            if (data.successs) {
              console.log('user added');
            }
          }
          console.log('registering passkey now...');
          let window_check = false;
          while (!window_check) {
            await sleep(2);
            if (isVisible) {
              window_check = true;
            }
          }
          setProgress('Registering PassKey...');
          const cco = parseCreationOptionsFromJSON({
            publicKey: {
              challenge: challenge,
              rp: {
                name: "next-webauthn",
                // TODO: Change
                id: window.location.hostname
              },
              user: {
                id: window.crypto.randomUUID(),
                name: email,
                displayName: email.substring(0, email.indexOf("@"))
              },
              pubKeyCredParams: [
                { alg: -7, type: "public-key" },
                { alg: -8, type: "public-key" },
                { alg: -257, type: "public-key" }
              ],
              timeout: 60000,
              attestation: "direct",
              authenticatorSelection: {
                residentKey: "required",
                userVerification: "required"
              }
            }
          });
          const credential_reg = await create(cco);
          const result = await fetch("/api/auth/register", 
            { method: "POST", body: JSON.stringify({ email: email, credential: credential_reg }), headers: {"Content-Type": "application/json"} });
          if (result.ok) {
            setProgress('Authentication using PassKey...')
            const cro = parseRequestOptionsFromJSON({
              publicKey: {
                challenge,
                timeout: 60000,
                userVerification: "required",
                rpId: window.location.hostname
              }
            });
            const credential_auth = await get(cro);
            setRegister(true)
            const result1 = await fetch("/api/auth/login", 
              { method: "POST", body: JSON.stringify({ email: email, credential: credential_auth }), headers: {"Content-Type": "application/json"} });
            if (result1.ok) {
              if (authonly) {
                await fetch(`/api/auth/logout`, { method: "POST" });
                setEmail(email);
              } else {
                const patient = await fetch("/api/couchdb/patients/" + email,
                  { method: "GET", headers: {"Content-Type": "application/json"} })
                  .then((res) => res.json());
                const is_phr = objectPath.has(patient, 'phr');
                if (!is_phr) {
                  if (!clinical) {
                    router.push("/newPatient/" + email);
                  } else {
                    router.push("/requestAccess");
                  }
                } else {
                  if (router.query.from) {
                    router.push(objectPath.get(router, 'query.from'));
                  } else {
                    router.push("/myTrustee/dashboard");
                  }
                }
              }
            } else {
              setRegister(false)
              const { message } = await result.json();
              setIsError(true);
              setError(message);
            }
          } else {
            const { message } = await result.json();
            setError(message);
          }
        } else {
          setIsChecking(false);
          setIsTimeout(true);
        }
      } else {
        setIsError(true);
        setError('Email not valid');
      }
    } else {
      setIsError(true);
      setError('Email required');
    }
  };

  const passKey = async(event: any) => {
    event.preventDefault();
    if (email !== '') {
      if (validate(email)) {
        setProgress('Authentication using PassKey...')
        const cro = parseRequestOptionsFromJSON({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: "required",
            rpId: window.location.hostname
          }
        });
        const credential_auth = await get(cro);
        setRegister(true)
        const result = await fetch("/api/auth/login", 
          { method: "POST", body: JSON.stringify({ email, credential: credential_auth }), headers: {"Content-Type": "application/json"} });
        if (result.ok) {
          if (authonly) {
            await fetch(`/api/auth/logout`, { method: "POST" });
            setEmail(email);
          } else {
            if (!clinical) {
              if (router.query.from) {
                router.push(objectPath.get(router, 'query.from'));
              } else {
                router.push("/myTrustee/dashboard");
              }
            } else {
              router.push("/requestAccess");
            }
          }
        } else {
          setRegister(false)
          const { message } = await result.json();
          setIsError(true)
          setError(message);
        }
      } else {
        setIsError(true)
        setError('Email not valid')
      }
    } else {
      setIsError(true)
      setError('Email required')
    }
  }

  const replay = () => {
    location.reload()
  }

  const sleep = async(seconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  const validate = (inputText: string) => {
    const emailRegex = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, "gm");
    return emailRegex.test(inputText);
  }

  return (
    <div>
      <div>
        {register ? (
          <div>
            {isAvailable ? (
              <Stack spacing={2}>
                <Grid style={{ textAlign: "center" }}><HowToRegIcon fontSize="large" color="primary"/>{progress}</Grid>
                <Grid style={{ textAlign: "center" }}><CircularProgress color="primary" /></Grid>
              </Stack>
            ) : (
              <p>Sorry, PassKey authentication is not available from this browser.</p>
            )}
          </div>
        ) : (
          <Box component="div">
            {authonly ? (
              <div>
                {clientExist ? (
                  <div>
                    <Typography variant="h6" component="div">Sign In To {client}</Typography>
                    <Typography variant="body1" component="div">For access to the following resources:</Typography>
                    <List>
                      {
                        locations.map((value: any, index:number) => {
                          return <ListItem key={index}>
                            {
                              value.actions.map((value0: string, index0: number) => {
                                {
                                  if (value0 === 'read') {
                                    return <ListItemAvatar><Avatar><VisibilityIcon/></Avatar></ListItemAvatar>
                                  }
                                  if (value0 === 'write') {
                                    return <ListItemAvatar><Avatar><EditIcon/></Avatar></ListItemAvatar>
                                  }
                                  if (value0 === 'delete') {
                                    return <ListItemAvatar><Avatar><DeleteIcon/></Avatar></ListItemAvatar>
                                  }
                                }
                              })
                            }
                            <ListItemText>
                              <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>{value.type}</AccordionSummary>
                                <AccordionDetails>
                                  <Typography variant="body2" component="div">Purpose: {value.purpose}</Typography>
                                  {
                                    value.locations.map((value1: string, index1: number) => {
                                      {
                                        return <Typography variant="caption" component="div">{value1}</Typography>
                                      }
                                    })
                                  }
                                </AccordionDetails>
                              </Accordion>
                            </ListItemText>
                          </ListItem>
                        })
                      }
                    </List>
                  </div>
                ) : (
                  <Typography variant="h6" component="div">Sign In</Typography>
                )}
              </div>
            ) : (
              <div>
                {clinical ? (
                  <p>Sign In to request access to a patient record</p>
                ) : (
                  <p>Subscribe to your own Trustee or Sign In with an existing account</p>
                )}
              </div>
            )}
            <Stack spacing={2}>
              <TextField
                error={isError}
                name="email" 
                type="email" 
                placeholder="Email Address (required)"
                helperText={error}
                variant="standard"
                inputRef={input => input && input.focus()}
                value={email}
                onChange={(e) => {setEmailValue(e.target.value);}}
                fullWidth
                required
              />
              {isAvailable ? (
                <Stack spacing={2}>
                  <Button variant="contained" onClick={passKey} startIcon={<div><PersonIcon/><KeyIcon/><Fingerprint/></div>}>Sign In with PassKey</Button>
                  {isChecking ? (<Grid style={{ textAlign: "center" }}><CircularProgress color="primary" sx={{mr:2}}/>Check your e-mail to verify...</Grid>) : (<div></div>)}
                  {isTimeout ? (<Grid style={{ textAlign: "center" }}><Typography variant="body2" color="error.main">Verification Timed Out - Click on the link below to try again...</Typography></Grid>) : (<div></div>)}
                  {isContinue ? (<Grid style={{ textAlign: "center" }}><Typography variant="body2" color="error.main">Looks like you were in the middle of verifying your email, click on Create your Trustee and Passkey to continue...</Typography></Grid>) : (<div></div>)}
                  {authonly || clinical ? (
                    <Grid style={{ textAlign: "center" }}>New to Trustee?  <Link component="button" onClick={createPassKey}>Create your Passkey</Link></Grid>
                  ) : (
                    <Grid style={{ textAlign: "center" }}>New to Trustee?  <Link component="button" onClick={createPassKey}>Create your Trustee and Passkey</Link></Grid>
                  )}
                  {isError ? (
                    <Button variant="contained" onClick={replay} startIcon={<div><ReplayIcon/></div>}>Start Over</Button>
                  ) : (<div></div>)}
                </Stack>
              ) : (
                <p>Sorry, PassKey authentication and registration is not available from this browser.</p>
              )}
            </Stack>
          </Box>
        )}
      </div>
    </div>
  );
}