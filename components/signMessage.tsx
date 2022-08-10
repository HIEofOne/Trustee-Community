import * as React from 'react';
import { useSignMessage } from 'wagmi'
import { verifyMessage } from 'ethers/lib/utils'
import { useEffect, useState } from 'react';

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
  const [val,setVal] = useState("")
  const {message} = props

  useEffect(() => {
    setVal(message);
  }, [message]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        //@ts-ignore
        const formData = new FormData(event.target)
        const message = formData.get('message')
        //@ts-ignore
        signMessage({ message })
      }}
    >
      <textarea
        id="message"
        name="message"
        value={val}
        rows={7}
        cols={40}
      /><br/>
      <button disabled={isLoading} className={`btn ${isLoading ? "btn-simple" : "btn-accented"}`} >
        {isLoading ? 'Check Wallet' : 'Sign Request'}
      </button>

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