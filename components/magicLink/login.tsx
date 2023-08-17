// pages/login.js
import { useRouter } from "next/router";
import { Magic } from "magic-sdk";
import { supported, create, get } from "@github/webauthn-json";
import { useEffect, useState } from "react";
import objectPath from 'object-path';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

export default function Login({ challenge, authonly=false, setEmail }: { challenge: string, authonly: boolean, setEmail?: any }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [register, setRegister] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    const checkAvailability = async () => {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsAvailable(available && supported());
    };
    checkAvailability();
  }, []);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const { elements } = event.target;
    if (elements.email.value !== '') {
      if (validate(elements.email.value)) {
        // Check if user has an account
        const isRegistered = await fetch("/api/couchdb/patients/" + elements.email.value,
          { method: "GET", headers: {"Content-Type": "application/json"} })
          .then((res) => res.json()).then((json) => json._id);
        //login with magic  
        if (typeof window === "undefined") return;
        const magicKey = await fetch("/api/magicLink/key", 
          { method: "POST" });
        var magicKeyData = await magicKey.json();
        const did = await new Magic(magicKeyData.key).auth.loginWithEmailOTP({ email: elements.email.value });
        // Once we have the did from magic, login with our own API
        const authRequest = await fetch("/api/magicLink/login", 
          { method: "POST", headers: { Authorization: `Bearer ${did}` }});
        if (authRequest.ok) {
          // Magic Link login successful!
          if (isRegistered === undefined) {
            const body = { email: elements.email.value, did: did };
            const res = await fetch(`/api/couchdb/patients/new`, 
              { method: "POST", headers : {"Content-Type": "application/json"}, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.successs) {
              console.log('user added');
            }
          }
          setProgress('Registering PassKey...');
          const credential = await create({
            publicKey: {
              challenge: challenge,
              rp: {
                name: "next-webauthn",
                // TODO: Change
                id: window.location.hostname
              },
              user: {
                id: window.crypto.randomUUID(),
                name: elements.email.value,
                displayName: elements.email.value.substring(0, elements.email.value.indexOf("@"))
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }],
              timeout: 60000,
              attestation: "direct",
              authenticatorSelection: {
                residentKey: "required",
                userVerification: "required"
              }
            }
          });
          const result = await fetch("/api/auth/register", 
            { method: "POST", body: JSON.stringify({ email: elements.email.value, credential }), headers: {"Content-Type": "application/json"} });
          if (result.ok) {
            setProgress('Authentication using PassKey...')
            const credential = await get({
              publicKey: {
                challenge,
                timeout: 60000,
                userVerification: "required",
                rpId: window.location.hostname
              }
            });
            const result1 = await fetch("/api/auth/login", 
              { method: "POST", body: JSON.stringify({ email: elements.email.value, credential }), headers: {"Content-Type": "application/json"} });
            if (result1.ok) {
              if (authonly) {
                setEmail(elements.email.value);
                //redirect to next step in gathering claims
                console.log('redirect to next step in gathering claims')
              } else {
                const patient = await fetch("/api/couchdb/patients/" + elements.email.value,
                  { method: "GET", headers: {"Content-Type": "application/json"} })
                  .then((res) => res.json())
                console.log(patient);
                const is_phr = objectPath.has(patient, 'phr');
                if (!is_phr) {
                  router.push("/newPatient/" + elements.email.value);
                } else {
                  if (router.query.from) {
                    router.push(objectPath.get(router, 'query.from'));
                  } else {
                    router.push("/myTrustee/dashboard");
                  }
                }
              }
            } else {
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

  const passKey = async() => {
    const email = (document.getElementById("email")! as HTMLInputElement).value;
    if (email !== '') {
      if (validate(email)) {
        const credential = await get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: "required",
            rpId: window.location.hostname
          }
        });
        const result = await fetch("/api/auth/login", 
          { method: "POST", body: JSON.stringify({ email, credential }), headers: {"Content-Type": "application/json"} });
        if (result.ok) {
          if (authonly) {
            //redirect to next step in gathering claims
            setEmail(email)
          } else {
            if (router.query.from) {
              router.push(objectPath.get(router, 'query.from'));
            } else {
              router.push("/myTrustee/dashboard");
            }
          }
        } else {
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
              <p><Box><HowToRegIcon fontSize="large"/></Box>{progress}<Box><CircularProgress color="inherit" /></Box></p>
            ) : (
              <p>Sorry, PassKey Registration is not available from this browser.</p>
            )}
          </div>
        ) : (
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            {authonly ? (
              <p>Authenticate Yourself</p>
            ) : (
              <p>Subscribe to your own Trustee or Login with an existing account</p>
            )}
              <Stack spacing={2}>
              <TextField
                error={isError}
                id="email" 
                name="email" 
                type="email" 
                placeholder="Email Address"
                helperText={error}
                variant="standard"
                inputRef={input => input && input.focus()}
                fullWidth
                required
              />
              {isAvailable ? (
                <Stack spacing={2}>
                  <Button variant="contained" onClick={passKey} startIcon={<div><PersonIcon/><KeyIcon/></div>}>Login with PassKey</Button>
                  <Button variant="contained" type="submit" startIcon={<div><PersonIcon/><KeyIcon/><AddIcon/></div>}>Register (new User or new PassKey)</Button>
                </Stack>
              ) : (
                <p>Sorry, webauthn is not available.</p>
              )}
            </Stack>
          </Box>
        )}
      </div>
    </div>
  );
}