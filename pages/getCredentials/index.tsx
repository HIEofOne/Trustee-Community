import Link from "next/link";
import * as React from "react";
import { useState } from "react";

//Landing Page
const PolicySummary = () => {
  return (
    <div>
      <div>
        <h2>Clinicians and other Care Team</h2>
        <hr className="solid" />
        <p>This Trustee Community issues W3C standard Verifiable Credentials to clinicians in the Federal NPES Registry (NPI number) and a current Doximity account.</p>
        <p>Community patients can choose to accept this credential in lieu of a specific invitation to access their record.</p>
        <p>Other issuers of standard W3C Verifiable Credentials can request listing in the community default privacy policy by contacting Support.</p>
      </div>
      <Link href="/"><button className="btn btn-accented">Sign-in to a Doximity Account</button></Link>
    </div>
  );
};

export default PolicySummary;
