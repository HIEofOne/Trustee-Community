import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "../../lib/useAuth";
import Record from "./record";
import Nano from "nano";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const domain = process.env.DOMAIN;

// This page displays all of a users records 
// and allows them to edit and create new ones

export default function ManageRecords(props:any) {
  if (props.email) {
    return (
      <>
        <div>
          <hr className="solid" />
          <h2>Your Managed Records</h2>
          <p>Chose a Record to Set Access Policy</p>
          {props.records?.map((record:any) => (
            <div key={record.id}>
              <Record data={record} action={props.changePage}/>
              <hr className="solid" />
            </div>
          ))}
          <button className="btn" onClick={() => props.changePage("dashboard")}>
            Cancel
          </button>
          <button className="btn btn-accented" onClick={() => {
            props.changePage("editRecord",{"new": true, "id": props.records? props.records.length + 1 : 1})}
          }>
            New Record
          </button>
        </div>
      </>
    );
  } else {
    return <p>error: not logged in</p>;
  }
}
