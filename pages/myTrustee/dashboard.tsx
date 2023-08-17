import * as React from "react";
import PolicySummary from "./PolicySummary";
import { isLoggedIn } from "../../lib/auth";
import router from "next/router";
import { useState } from "react";
import Policies from "../../components/policies";
import { withIronSessionSsr } from "iron-session/next";
import { sessionOptions } from "../../lib/session";
import { InferGetServerSidePropsType } from "next";

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function Dashboard({
  userId, jwt
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

  if (userId === null) {
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
          <PolicySummary />
          <Stack spacing={2} direction="row">
            <Button variant="contained" onClick={() => logout()}>
              Logout
            </Button>
            <Button variant="contained" onClick={() => changePage("policies")}>
              Review and Edit My Resources and Policies
            </Button>
          </Stack>
        </div>
      </div>
    );
  } else if (page == "policies") {
    return (
      <div>
        <Policies
          email={userId}
          jwt={jwt}
          changePage={changePage}
        />
      </div>
    );
  } else {
    return <div></div>;
  }
}

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
  resolvedUrl
}) {
    if (!isLoggedIn(req)) {
      return {
        redirect: {
          destination: `/?from=${encodeURIComponent(resolvedUrl)}`,
          permanent: false
        }
      };
    }
    return {
      props: {
        userId: req.session.userId ?? null,
        jwt: req.session.jwt ?? null,
      }
    };
  },
  sessionOptions
);