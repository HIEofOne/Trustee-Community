import * as React from "react";
import PolicySummary from "./PolicySummary";
import useAuth from "../../lib/useAuth";
import router from "next/router";
import { useEffect, useState } from "react";
import ManageRecords from "../../components/manageRecords";
import Edit from "../../components/manageRecords/edit";

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
//Landing Page
export default function Dashboard() {
  const { user, loading } = useAuth();
  //for switching between views
  //dashboard - manageRecords - editRecord
  const [page, setPage] = useState("dashboard");
  const [pageData, setPageData] = useState();
  //Users records and access policies
  const [records, setRecords] = useState([{}]);

  //clears cookies but does not logout from
  //Magic Link. Session will automaticaly timeout.
  const logout = async() => {
    await fetch(`/api/magicLink/logout`, { method: "POST" })
      .then(() => {
      router.push("/");
    });
  };

  // Close out of current page and choose next page
  // to display. Pass data to next page.
  const changePage = (page: string, data?: any) => {
    if (data) {
      if (page == "editRecord") {
        setPageData(data);
        setPage(page);
      }
    } else {
      setPage(page);
    }
  };

  const getRecords = async() => {
    if (user) {
      await fetch("/api/couchdb/records/" + user.email, 
        { method: "GET", headers: {"Content-Type": "application/json"} })
        .then((res) => res.json()).then((json) => {
          setRecords(json.records);
        });
    }
  };

  useEffect(() => {
    getRecords();
  });

  if (!user) {
    return (
      <div>
        <p>Session expired: Please sign in to continue</p>
        <Button variant="contained" component="a" href="/myTrustee" >
          Sign In
        </Button>
      </div>
    );
  }
  //Toggle between pages
  if (page == "dashboard") {
    return (
      <div>
        {/* @ts-ignore */}
        {loading ? (
          "Loading..."
        ) : (
          <div>
            <PolicySummary records={records} />
            <Stack spacing={2} direction="row">
              <Button variant="contained" onClick={() => logout()}>
                Logout
              </Button>
              <Button variant="contained" onClick={() => changePage("manageRecords")}>
                {records? "Review and Edit My Policies" : "Create New Policies"}
              </Button>
            </Stack>
          </div>
        )}
      </div>
    );
  } else if (page == "manageRecords") {
    return (
      <div>
        <ManageRecords
          email={user.email}
          changePage={changePage}
          records={records}
        />
      </div>
    );
  } else if (page == "editRecord" && pageData) {
    //display editRecord
    return <Edit data={pageData} cancel={changePage} email={user.email} />;
  } else {
    return <div></div>;
  }
}
