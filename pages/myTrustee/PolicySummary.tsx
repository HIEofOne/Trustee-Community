import * as React from "react";
import { useState } from "react";

const PolicySummary = (props:any) => {

  return (
    <div>
      <div>
        <h1>Privacy Policy Summary</h1>
        <hr className="solid" />
        <h4>Policies for everyone in the Trustee community:</h4>
        <ul>
          <li>
            We collect emails to contact and identify you but we do not share them with anyone.
          </li>
          <li>
            We use Stripe. We do not have access to your credit card information.
          </li>
          <li>
            We do not read or use your information except as directed by policies you can customize.
          </li>
          <li>
            Trustee Community issues access credentials based on active Doximity accounts.
          </li>
        </ul>
      </div>
      <div>
        <hr className="solid" />
        <h4>Default data use policies you can customize:</h4>
        <ul>
          <li>
            You currently have {props.records ? props.records.length : 0} policy forms{props.records ? " last modified: " + props.records[props.records.length - 1].date : "."}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PolicySummary;
