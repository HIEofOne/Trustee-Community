import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

//Landing Page
const NewPatient = () => {
  const [accountCreated, setAccountCreated] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { email } = router.query;

  if (!email) {
    return <p>Error: No Email Detected</p>;
  }

  const createAccount = async (e: any) => {
    e.preventDefault();

    //user must accept privacy
    if (!privacy) {
      return;
    }


    var body = {
      email: email,
    };

    const success =  await fetch(`/api/couchdb/patients/${email}/acceptTerms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then(json => json.success)
    if (success) {
      setAccountCreated(true)
    }
  };

  const cancel = () => {
    router.push("/")
  }

  return (
    <div className="div">
      <hr className="solid" />
      <h1>New Patient</h1>
      <h4>Email: {email}</h4>
      {!accountCreated ? (
        <div className="section">
          <p>
            Your email address is used to manage your Trustee and to recieve notification of activity. We will not share this email address beyond our community support and billing activity and you can cancel anytime.
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
            </label> <br />
            <input type="submit" value="Subscribe" className="btn btn-accented"/>
            <button className="btn" onClick={() => cancel()} >Cancel</button>
          </form>
          {error != "" && (
            <div>
              <hr className="solid" />
              <p style={{ color: "red" }}>Error: {error}</p>
              <Link href="/myTrustee">
                <button className="btn btn-simple">
                  Sign-in to manage your records access policies
                </button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>Your Trustee Account is now Active!</p>
          <p>
            After 30 days, an email will ask you to provide payment information
            for your subscription.
          </p>
          <Link href="/myTrustee">
            <button className="btn btn-accented">
              Continue to review and modify the policies that controll your
              Trustee.
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default NewPatient;
