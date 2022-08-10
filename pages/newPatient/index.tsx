import * as React from "react";
import { useState } from "react";
import Link from 'next/link'


//Landing Page
//@ts-ignore
const NewPatient = (props) => {
  const [email, setEmail] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");


  const { children } = props;

  //@ts-ignore
  const createAccount = async (e) => {
    e.preventDefault();

    //user must accept privacy
    if (!privacy) {
      return;
    }

    var body = {
      email: email
    };

    fetch(`/api/couchdb/newPatient`, {
      method: "POST",
      headers : { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then((res) =>  res.json())
      .then(async (data) => {
        console.log("response", data);
        if (data.success) {
          console.log(1) 
          setAccountCreated(true);
        }
        if (data.error) {
            if (data.reason == "Document update conflict.") {
                setError("An account attached to this email already exists.")
            } else {
                setError(data.reason)
            }
        }
      });
  };

  return (
    <div className="div">
      <hr className="solid" />
      <h1>New Patient</h1>
      {!accountCreated ? (
        <div className="section">
          <p>
            Your email address is used to manage your Trustee and recieve
            notification of activity. We will not share this email address
            beyond our community support and billing activity and you can cancel
            anytime.
          </p>
          <form onSubmit={createAccount}>
            <input
              type="checkbox"
              id="privacy"
              name="privacy"
              checked={privacy}
              onChange={() => setPrivacy(!privacy)}
              style={{ marginBottom: "20px" }}
            ></input>
            <label htmlFor="privacy">
              I have read the Privacy Policy and agree.
            </label>
            <br></br>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-submit">
              Submit
            </button>
          </form>
          {error != "" && (
        <div>
            <hr className="solid" />
          <p style={{ color: "red" }}>Error: {error}</p>
          <Link href="/myTrustee"><button className="btn btn-simple">Sign-in to manage your records access policies</button></Link>
        </div>
      )}
        </div>
      ) : (
        <div>
            <p>Your Trustee Account is now Active!</p>
            <p>After 30 days, an email will ask you to provide payment information for your subscription.</p>
            <Link href="/myTrustee"><button className="btn btn-accented">Continue to review and modify the policies that controll your Trustee.</button></Link>
        </div>
      )}
    </div>
  );
};

export default NewPatient;
