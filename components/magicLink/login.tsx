import { useRouter } from 'next/router';
import { Magic } from 'magic-sdk';
import { create, get, parseCreationOptionsFromJSON, parseRequestOptionsFromJSON, RegistrationPublicKeyCredential, supported } from '@github/webauthn-json/browser-ponyfill';
import { type PublicKeyCredentialDescriptorJSON } from '@github/webauthn-json'
import type { RegistrationResponseExtendedJSON } from '@github/webauthn-json/browser-ponyfill/extended';
import { useEffect, useState } from 'react';
import objectPath from 'object-path';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from "@mui/material/Grid";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import KeyIcon from '@mui/icons-material/Key';
import Link from '@mui/material/Link';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

function displayRegistrations() {
  registrationElem().value = JSON.stringify(getRegistrations(), null, "  ");
}

function getRegistrations(): RegistrationResponseExtendedJSON[] {
  const registrations = JSON.parse(
    localStorage.webauthnExampleRegistrations || "[]",
  );
  return registrations;
}

function registeredCredentials(): PublicKeyCredentialDescriptorJSON[] {
  return getRegistrations().map((reg) => ({
    id: reg.rawId,
    type: reg.type,
  }));
}

function registrationElem(): HTMLTextAreaElement {
  return document.querySelector("#registrations")! as HTMLTextAreaElement;
}

function saveRegistration(
  registration: RegistrationPublicKeyCredential,
): void {
  const registrations = getRegistrations();
  registrations.push(registration.toJSON());
  setRegistrations(registrations);
}

function setRegistrations(
  registrations: RegistrationResponseExtendedJSON[],
): void {
  localStorage.webauthnExampleRegistrations = JSON.stringify(
    registrations,
    null,
    "  ",
  );
  displayRegistrations();
}

export default function Login({ challenge, clinical=false, authonly=false, client='', setEmail }: { challenge: string, clinical: boolean, authonly: boolean, client?: string, setEmail?: any }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [register, setRegister] = useState(false);
  const [progress, setProgress] = useState("");
  const [email, setEmailValue] = useState("");
  const [clientExist, setClientExist] = useState(false); 

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
  }, [client]);

  const createPassKey = async () => {
    if (email !== '') {
      if (validate(email)) {
        // Check if user has an account
        const isRegistered = await fetch("/api/couchdb/patients/" + email,
          { method: "GET", headers: {"Content-Type": "application/json"} })
          .then((res) => res.json()).then((json) => json._id);
        //login with magic  
        if (typeof window === "undefined") return;
        const magicKey = await fetch("/api/magicLink/key", 
          { method: "POST" });
        var magicKeyData = await magicKey.json();
        const did = await new Magic(magicKeyData.key).auth.loginWithEmailOTP({ email: email });
        // Once we have the did from magic, login with our own API
        const authRequest = await fetch("/api/magicLink/login", 
          { method: "POST", headers: { Authorization: `Bearer ${did}` }});
        if (authRequest.ok) {
          // Magic Link login successful!
          if (isRegistered === undefined) {
            const body = { email: email, did: did };
            const res = await fetch(`/api/couchdb/patients/new`, 
              { method: "POST", headers : {"Content-Type": "application/json"}, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.successs) {
              console.log('user added');
            }
          }
          if (authonly) {
            await fetch(`/api/auth/logout`, { method: "POST" });
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
              pubKeyCredParams: [{ alg: -7, type: "public-key" }],
              excludeCredentials: registeredCredentials(),
              timeout: 60000,
              attestation: "direct",
              authenticatorSelection: {
                residentKey: "required",
                userVerification: "required"
              }
            }
          })
          const credential_cco = await create(cco);
          saveRegistration(credential_cco)  
          const result = await fetch("/api/auth/register", 
            { method: "POST", body: JSON.stringify({ email: email, credential_cco }), headers: {"Content-Type": "application/json"} });
          if (result.ok) {
            setProgress('Authentication using PassKey...')
            const cro = parseRequestOptionsFromJSON({
              publicKey: {
                challenge,
                timeout: 60000,
                userVerification: "required",
                rpId: window.location.hostname
              }
            })
            const credential_cro = await get(cro);
            setRegister(true)
            const result1 = await fetch("/api/auth/login", 
              { method: "POST", body: JSON.stringify({ email: email, credential_cro }), headers: {"Content-Type": "application/json"} });
            if (result1.ok) {
              if (authonly) {
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
          const { message } = await authRequest.json();
          setIsError(true);
          setError(message);
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
        })
        const credential_cro = await get(cro);
        setRegister(true)
        const result = await fetch("/api/auth/login", 
          { method: "POST", body: JSON.stringify({ email, credential_cro }), headers: {"Content-Type": "application/json"} });
        if (result.ok) {
          if (authonly) {
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
    setRegistrations([]);
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
              <Box>
                <Grid style={{ textAlign: "center" }}><HowToRegIcon fontSize="large" color="primary"/>{progress}</Grid>
                <Grid style={{ textAlign: "center" }}><CircularProgress color="primary" /></Grid>
              </Box>
            ) : (
              <p>Sorry, PassKey authentication is not available from this browser.</p>
            )}
          </div>
        ) : (
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={passKey}
          >
            {authonly ? (
              <div>
                {clientExist ? (
                  <p>Sign Into {client}</p>
                ) : (
                  <p>Sign In</p>
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
              {isError ? (
                <div>
                  <Stack spacing={2}>
                    <Button variant="contained" onClick={replay} startIcon={<div><ReplayIcon/></div>}>Start Over</Button>
                  </Stack>
                </div>
              ) : (
                <div>
                  {isAvailable ? (
                    <Stack spacing={2}>
                      <Button variant="contained" onClick={passKey} startIcon={<div><PersonIcon/><KeyIcon/></div>}>Sign In with PassKey</Button>
                      {authonly || clinical ? (
                        <Grid style={{ textAlign: "center" }}>New to Trustee?  <Link component="button" onClick={createPassKey}>Create your Passkey</Link></Grid>
                      ) : (
                        <Grid style={{ textAlign: "center" }}>New to Trustee?  <Link component="button" onClick={createPassKey}>Create your Trustee and Passkey</Link></Grid>
                      )}
                    </Stack>
                  ) : (
                    <p>Sorry, PassKey authentication and registration is not available from this browser.</p>
                  )}
                </div>
              )}
            </Stack>
          </Box>
        )}
      </div>
    </div>
  );
}