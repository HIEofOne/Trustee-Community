import * as React from 'react';
import PolicySummary from './PolicySummary';
import router from 'next/router';
import { useState } from 'react';
import Policies from '../../components/policies';
import Pending from '../../components/pending';
import { getIronSession } from 'iron-session';
import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { SessionData, sessionOptions } from '../../lib/session';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function Dashboard({
  session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [page, setPage] = useState("dashboard");

  // Close out of current page and choose next page to display. Pass data to next page.
  const changePage = (page: string) => {
    setPage(page);
  };

  //clears cookies but does not logout from MagicLink and Passkey. Session will automaticaly timeout.
  const logout = async() => {
    await fetch(`/api/auth/logout`, { method: "POST" });
    router.push("/");
  };

  if (session.userId === null) {
    return (
      <div>
        <p>Session expired: Please sign in to continue</p>
        <Button variant="contained" component="a" href="/myTrustee" >
          Sign In
        </Button>
      </div>
    );
  }
  if (page == "dashboard") {
    return (
      <div>
        <div>
          <Stack spacing={2} direction="row">
            <Button variant="contained" onClick={() => logout()}>
              Logout
            </Button>
            <Button variant="contained" onClick={() => changePage("policies")}>
              Review and Edit My Resources and Policies
            </Button>
            <Button variant="contained" onClick={() => changePage("pending")}>
              Review Pending Requests
            </Button>
          </Stack>
          <PolicySummary />
        </div>
      </div>
    );
  } else if (page == "policies") {
    return (
      <div>
        <Policies
          email={session.userId}
          jwt={session.jwt}
          changePage={changePage}
        />
      </div>
    );
  } else if (page == "pending") {
    return (
      <div>
        <Pending
          email={session.userId}
          changePage={changePage}
        />
      </div>
    )
  } else {
    return <div></div>;
  }
}

export const getServerSideProps = (async (context) => {
  const session = await getIronSession<SessionData>(
    context.req,
    context.res,
    sessionOptions,
  );
  if (!session.isLoggedIn) {
    return {
      redirect: {
        destination: `/?from=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }
  return { props: { session } };
}) satisfies GetServerSideProps<{
  session: SessionData;
}>;