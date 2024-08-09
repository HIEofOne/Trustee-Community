import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import Login from '../../components/magicLink/login';
import Credentials from '../../components/credentials';
import { withIronSessionSsr } from 'iron-session/next';
import { generateChallenge } from '../../lib/auth';
import { sessionOptions } from '../../lib/session';
import objectPath from 'object-path';

import Snackbar from '@mui/material/Snackbar';

export default function Interact({ challenge }: { challenge: string }) {
  const [pageStatus, setPageStatus] = useState(true);
  const [emailStatus, setEmailStatus] = useState(false);
  const [email, setEmailValue] = useState("");
  const [docInstance, setDocInstance] = useState({});
  const { query, isReady } = useRouter();
  const [openNotification, setOpenNotification] = useState(false);
  const [notification, setNotification] = useState("");
  const [client, setClient] = useState("");
  const [locations, setLocations] = useState([]);
  
  const closeNotification = () => {
    setOpenNotification(false);
  }

  const getInstance = useCallback(async() => {
    const body = {id: query.id};
    const isInstance = await fetch("/api/as/instance",
      { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json());
    if (isInstance.success) {
      setDocInstance(isInstance.success);
      if (objectPath.has(isInstance, 'success.client.display.name')) {
        setClient(isInstance.success.client.display.name);
      }
      if (objectPath.has(isInstance, 'access_token.access')) {
        setLocations(isInstance.success.access_token.access)
      }
    }
    if (isInstance.error) {
      setPageStatus(false);
    }
  },[query])

  const notificationOpen = (message: string) => {
    setNotification(message)
    setOpenNotification(true);
  }
  
  const setEmail = async(email: string) => {
    const doc = docInstance;
    objectPath.set(doc, 'email', email);
    setDocInstance(doc);
    setEmailValue(email);
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

  const updateDoc = (doc: object) => {
    setDocInstance(doc);
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
          <Login challenge={challenge} clinical={false} authonly={true} client={client} setEmail={setEmail} locations={locations}/>
        </div>
      </>
    );
  } else {
    return (
      <div>
        <Credentials id={query.id} doc={docInstance} update_doc={updateDoc} interact={true} notification={notificationOpen} email={email}/>
        <Snackbar
          open={openNotification}
          autoHideDuration={3000}
          onClose={closeNotification}
          message={notification}
        />
      </div>
    );
  }
}

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
}) {
  const challenge = generateChallenge();
  req.session.challenge = challenge;
  await req.session.save();
  return { props: { challenge } };
},
sessionOptions);