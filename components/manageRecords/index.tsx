import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "../../lib/useAuth";
import Record from "./record";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';

// This page displays all of a users records 
// and allows them to edit and create new ones


export default function ManageRecords(props:any) {
  if (props.email) {
    return (
      <>
        <div>
          <h2>Your Managed Records</h2>
          <p>Choose a Record to Set Access Policy</p>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 1, pb: 1 }}>
          {props.records?.map((record:any) => (
            <div key={record.id}>
              <Box sx={{ display: 'flex', flexDirection: 'row', p: 1 }}>
                <Record data={record} action={props.changePage}/>
              </Box>
            </div>
          ))}
          </Box>
          <Stack spacing={2} direction="row">
            <Button variant="contained" onClick={() => props.changePage("dashboard")}>
              Back
            </Button>
            <Button variant="contained" onClick={() => {props.changePage("editRecord",{"new": true, "id": props.records? props.records.length + 1 : 1})}}>
              New Record
            </Button>
          </Stack>
        </div>
      </>
    );
  } else {
    return <p>error: not logged in</p>;
  }
}
