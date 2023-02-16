import * as React from "react";
import { useSignMessage } from "wagmi";
import { verifyMessage } from "ethers/lib/utils";
import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";


//@ts-ignore
export default function SignMessage(props) {
  const recoveredAddress = React.useRef<string>();
  const { data, error, isLoading, signMessage } = useSignMessage({
    onSuccess(data, variables) {
      // Verify signature when sign message succeeds
      const address = verifyMessage(variables.message, data);
      recoveredAddress.current = address;
    },
  });
  const [message, setMessage] = useState("");
  const { req, callback } = props;

  useEffect(() => {
    if (error) {
      alert("Error: " + error)
    } else {
      callback(data, recoveredAddress.current, message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  const sign = () => {
    // var message:any = formData.get('message')
    // setMessage(message)
    const str = message + "\n" + req;
    signMessage({ message: str });
  };

  const handleChange = (event:any) => {
    setMessage(event.target.value);
  };

  return (
    <Box
      component="form"
      sx={{
        '& .MuiTextField-root': { m: 1, width: '25ch' },
      }}
      noValidate
      autoComplete="off"
      onSubmit={(event: any) => {
        event.preventDefault();
      }}
    >
      <TextField
        multiline
        placeholder="Message" 
        variant="standard"
        id="message"
        name="message"
        maxRows={4}
      /><br/>
      <Button disabled={isLoading} type="submit" variant={`${isLoading ? "outlined" : "contained"}`} >
        {isLoading ? 'Check Wallet' : 'Sign Request'}
      </Button>

      {data && (
        <div>
          <div>Recovered Address: {recoveredAddress.current}</div>
          <div>Signature: {data}</div>
        </div>
      )}

      {error && <div>{error.message}</div>}
    </Box>
  )
}
