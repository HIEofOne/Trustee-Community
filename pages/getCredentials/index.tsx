import * as React from 'react';

import Button from '@mui/material/Button';

//Landing Page
const PolicySummary = () => {
  return (
    <div>
      <div>
        <h2>Clinicians and Care Team</h2>
        <hr />
        <p>This Trustee Community issues W3C standard Verifiable Credentials to clinicians in the Federal NPES Registry (NPI number) and a current Doximity account.</p>
        <p>Community patients can choose to accept this credential in lieu of a specific invitation to access their record.</p>
        <p>Other issuers of standard W3C Verifiable Credentials can request listing in the community default privacy policy by contacting Support.</p>
      </div>
      <Button component="a" href="https://dir.hieofone.org/doximity" target="_blank" variant="contained">
        Sign-in to a Doximity Account
      </Button>
    </div>
  );
};

export default PolicySummary;
