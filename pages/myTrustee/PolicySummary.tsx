import * as React from 'react';

const PolicySummary = (props:any) => {

  return (
    <div>
      <div>
        <h2>Privacy Policy Summary</h2>
        <hr className="solid" />
        <h4>Policies for everyone in the Trustee community:</h4>
        <ul>
          <li>
            We collect emails to contact and identify you but we do not share them with anyone.
          </li>
          <li>
            We do not read or use your information except as directed by policies you can customize.
          </li>
          <li>
            We do not disclose your information except as directed by policies you can customize.
          </li>
          <li>
            Trustee Community issues access credentials based on a specific email invitation or a patient’s policy linked to  active Doximity accounts.
          </li>
          <li>
            Patient data in the cloud is secured through encryption in transit and at rest. Access and policy enforcement are based on the IETF RFC 9635 protocol. Access authorization is secured with Passkeys to prevent password phishing and sharing.
          </li>
          <li>
            Data retention is entirely patient-controlled. Patients can easily delete their health record data at any time, leaving only their contact email in our files. We do not review, share or use invitation email addresses or other access authorization policies except for the specific purpose of access authorization.
          </li>
          <li>
            Trustee clinical data and authorization services are managed through typical hosting accounts at Digital Ocean, Inc. or Netlify, Inc. Neither HIE of One or our hosting providers share data with third-parties.
          </li>
          <li>
            As a free and non-commercial demonstration, Trustee accounts may be closed and data deleted at any time. Users are encouraged to make and keep local copies on their computer or mobile device.
          </li>
          <li>
            Trustee protects against unintended or overly broad data sharing in multiple ways:
            <ul>
              <li>
                Patients have fine-grained control over health record segments they capture from hospital records via SMART on FHIR.
              </li>
              <li>
                As a free service, patients concerned about family access demands can easily create alternate health records by simply using a different email address. 
              </li>
              <li>
                The use of passkeys instead of passwords discourages requests for password sharing.
              </li>
              <li>
                Patients also have fine-grained control over data shared through invited access via email or via policy.
              </li>
              <li>
                Patients have access to synthetic data files as a “sandbox” to help them better understand health record and sharing functionality before using Trustee with real patient data.
              </li>
            </ul>
          </li>
          <li>
            Restriction or withdrawal of an invited email address and changes in policy-based access are done on-line and effective immediately. 
          </li>
        </ul>
        <h4>Optional Policies Available:</h4>
        <ul>
          <li>
            NPI (npi): Any user with a Verifiable Credential including the <a href="https://npiregistry.cms.hhs.gov/search" target="_blank">NPI (National Provider Identifier)</a> can access (or edit) the resource.
          </li>
          <li>
            Offline (offline): Any user can access (or edit) the resource wihthout your authorization.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PolicySummary;
