// pages/login.js
import { useRouter } from "next/router";
import { Magic } from "magic-sdk";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

export default function Login() {
  const router = useRouter();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const { elements } = event.target;
    // Check if user has an account
    const isRegistered = await fetch("/api/couchdb/patients/" + elements.email.value,
      { method: "GET", headers: {"Content-Type": "application/json"} })
      .then((res) => res.json()).then((json) => json.success);
    //login with magic  
    if (typeof window === "undefined") return;
    const magicKey = await fetch("/api/magicLink/key", 
      { method: "POST" });
    var magicKeyData = await magicKey.json();
    const did = await new Magic(magicKeyData.key).auth.loginWithMagicLink({ email: elements.email.value });
    // Once we have the did from magic, login with our own API
    const authRequest = await fetch("/api/magicLink/login", 
      { method: "POST", headers: { Authorization: `Bearer ${did}` }});
    if (authRequest.ok) {
      // Magic Link login successful!
      // Check if email is registered
      if (isRegistered) {
        router.push("/myTrustee/dashboard");
      } else {
        // add account to couchdb
        router.push("/newPatient/" + elements.email.value);
      }
    } else {
      /* handle errors */
    }
  };

  return (
    <div>
      <div>
          <Box
            component="form"
            sx={{
              '& .MuiTextField-root': { m: 1, width: '25ch' },
            }}
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <p>Subscribe to your own Trustee or Login with an existing account</p>
            <TextField name="email" type="email" placeholder="Email Address" variant="standard"/>
            <Button variant="contained" type="submit">Submit</Button>
          </Box>
      </div>
    </div>
  );
}