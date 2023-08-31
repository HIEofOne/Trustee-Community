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
            We use Stripe. We do not have access to your credit card information.
          </li>
          <li>
            We do not read or use your information except as directed by policies you can customize.
          </li>
          <li>
            Trustee Community issues access credentials based on active Doximity accounts.
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
