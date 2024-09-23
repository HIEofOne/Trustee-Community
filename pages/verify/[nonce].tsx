import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

export default function Verify() {
  const { query, isReady } = useRouter();
  const [pageStatus, setPageStatus] = useState(true);
  const getVerify = useCallback(async() => {
    try {
      const body = {nonce: query.nonce};
      const isVerify = await fetch("/api/auth/verify",
        { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
        .then((res) => res.json());
      if (isVerify.success) {
        setPageStatus(true);
      } else {
        setPageStatus(false);
      }
    } catch (e) {
      setPageStatus(false);
    }
  },[query])

  useEffect(() => {
    if (isReady) {
      getVerify().catch(console.error);
    }
  },[isReady, getVerify]);

  if (!pageStatus) {
    return (
      <div>
        <h4><ThumbDownIcon color='error' sx={{ mr: 2 }}/>Verification failed!</h4>
      </div>
    );
  } else {
    return (
      <div>
        <h4><ThumbUpIcon color='success'  sx={{ mr: 2 }}/>Verification successful!</h4>
        <p>You can now close this page and return back to Trustee to register your Passkey.</p>
      </div>
    );
  }
}