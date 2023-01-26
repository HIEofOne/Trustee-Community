import * as React from 'react';
import { useSignMessage } from 'wagmi'
import { verifyMessage } from 'ethers/lib/utils'
import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

//@ts-ignore
export default function SignMessage(props) {
  const recoveredAddress = React.useRef<string>()
  const { data, error, isLoading, signMessage } = useSignMessage({
    onSuccess(data, variables) {
      // Verify signature when sign message succeeds
      const address = verifyMessage(variables.message, data)
      recoveredAddress.current = address
    },
  })
  const [message, setMessage] = useState("")
  const {req, callback} = props

  useEffect(() => {
    console.log(data, error)
    if(error) {
      alert("Error: " + error)
    } else {
      callback(data, recoveredAddress.current, message)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error])

  return (
    <form
      onSubmit={(event: any) => {
        event.preventDefault()
        const formData = new FormData(event.target)
        var message:any = formData.get('message')
        setMessage(message)
        message = message + req
        signMessage({ message: message })
      }}
    >
      <textarea
        id="message"
        name="message"
        rows={3}
        cols={40}
      /><br/>
      <Button disabled={isLoading} variant={`${isLoading ? "outlined" : "contained"}`} >
        {isLoading ? 'Check Wallet' : 'Sign Request'}
      </Button>

      {data && (
        <div>
          <div>Recovered Address: {recoveredAddress.current}</div>
          <div>Signature: {data}</div>
        </div>
      )}

      {error && <div>{error.message}</div>}
    </form>
  )
}