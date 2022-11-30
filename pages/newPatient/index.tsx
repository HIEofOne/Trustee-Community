// @ts-ignore
import * as React from "react";
// @ts-ignore
import { useState } from "react";
import Link from 'next/link'


//Landing Page
//@ts-ignore
const NewPatient = (props) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [DOB, setDOB] = useState("")
  const [gender, setGender] = useState("")
  const [accountCreated, setAccountCreated] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pin3, setPin3] = useState("");
  const [pin4, setPin4] = useState("");
  const [url, setURL] = useState("");

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

    var birthGender = 'UNK';
    if (gender == 'male') {
      birthGender = 'M';
    }
    if (gender == 'female') {
      birthGender = 'F';
    }
    if (gender == 'other') {
      birthGender = 'OTH';
    }
    var body1 = {
      email: email,
      first_name: firstName,
      last_name: lastName,
      dob: DOB,
      gender: gender,
      birthGender: birthGender,
      pin: pin1 + pin2 + pin3 + pin4
    };

    var res = await fetch(`/api/couchdb/newPatient`, {
      method: "POST",
      headers : { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    var data = await res.json()
    console.log("response", data);
    if (data.success) {
      setAccountCreated(true);
    }
    if (data.error) {
      if (data.reason == "Document update conflict.") {
        setError("An account attached to this email already exists.")
      } else {
        setError(data.reason)
      }
    }
    var res1 = await fetch('/api/deploy', {
      method: 'POST',
      headers : { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body1)
    })
    var data1 = await res1.json()
    setURL(data1.url)
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
          <p>
            Your name, date of birth, and gender and 4-digit PIN are only used to create your personal 
            health record. The 4-digit PIN is to encrypt/decrypt your database.
            We will not save or share your personal information.
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
            <label htmlFor="email">Email:</label><br/>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            /><br/><br/>
            <label htmlFor="firstName">First Name</label><br/>
            <input
              type="text"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            /><br/><br/>
            <label htmlFor="lastName">Last Name</label><br/>
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            /><br/><br/>
            <label htmlFor="DOB">Date of Birth</label><br/>
            <input
              type="date"
              name="DOB"
              value={DOB}
              onChange={(e) => setDOB(e.target.value)}
              required
            /><br/><br/>
            <label htmlFor="gender">Gender</label><br/>
            <select
              name="gender"
              value={gender}
              onChange={(e) =>setGender(e.target.value)}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select><br/><br/>
            <label htmlFor="pin">4-Digit PIN</label><br/>
            <input
              type="password"
              name="pin1"
              required
              maxLength={1}
              onChange={(e) =>setPin1(e.target.value)}
            />
            <input
              type="password"
              name="pin2"
              required
              maxLength={1}
              onChange={(e) =>setPin2(e.target.value)}
            />
            <input
              type="password"
              name="pin3"
              required
              maxLength={1}
              onChange={(e) =>setPin3(e.target.value)}
            />
            <input
              type="password"
              name="pin4"
              required
              maxLength={1}
              onChange={(e) =>setPin4(e.target.value)}
            /><br/><br/>
            <button type="submit" className="btn btn-submit">
              Submit
            </button>
          </form>
          {error != "" && (
        <div>
            <hr className="solid" />
          <p style={{ color: "red" }}>Error: {error}</p>
          <Link href="/myTrustee" passHref><button className="btn btn-simple">Sign-in to manage your records access policies</button></Link>
        </div>
      )}
        </div>
      ) : (
        <div>
            <p>Your Trustee Account is now Active!</p>
            <p>After 30 days, an email will ask you to provide payment information for your subscription.</p>
            <p>Your personal health record is <Link href={url} passHref target="_blank">{url}</Link></p>
            <Link href="/myTrustee" passHref><button className="btn btn-accented">Continue to review and modify the policies that control your Trustee.</button></Link>
        </div>
      )}
    </div>
  );
};

export default NewPatient;
