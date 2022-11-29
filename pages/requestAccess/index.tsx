import Link from "next/link";
import * as React from "react";
import { useEffect, useState } from "react";
import { Profile } from "../../components/profile";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "../../components/connectWallet";
import SignMessage from "../../components/signMessage";
import { recoverAddress } from "ethers/lib/utils";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

// import SignInWithEthereum from "../../components/SignInWithEthereum";

//Landing Page
const RequestAccess = () => {
  const [patient, setPatient] = useState("");
  const [credential, setCredential] = useState("");
  const [request, setRequest] = useState("");
  const [resourceType, setResourceType] = useState("Steps");
  const [resourceDate, setResourceDate] = useState(new Date());

  //Checkboxes
  var scope = ["Read", "Update", "Create"];

  const [checkedScope, setCheckedScope] = useState(
    new Array(scope.length).fill(false)
  );

  var purpose = [
    "Clinical-routine",
    "Clinical-emergency",
    "Research",
    "Customer support",
    "Other",
  ];

  const [checkedPurpose, setCheckedPurpose] = useState(
    new Array(purpose.length).fill(false)
  );


  const updateScope = (position: number) => {
    const updated = checkedScope.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedScope(updated);
  };

  const updatePurpose = (position: number) => {
    const updated = checkedPurpose.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedPurpose(updated);
  };

  const formatDate = (d: Date) => {

    var date = d.getDate();

    var month = d.getMonth();

    var year = d.getFullYear();
    return date + "/" + month + "/" + year
  }

  const generateRequest = () => {
    var selectedScope = scope.filter((item, index) => {
      if (checkedScope[index] == true) {
        return item;
      }
    });

    var selectedPurpose = purpose.filter((item, index) => {
      if (checkedPurpose[index] == true) {
        return item;
      }
    });

    var request = `
Details of request:    
Patient: ${patient}
Scope: ${selectedScope}
Purpose: ${selectedPurpose}`;
    setRequest(request);

    return [patient, selectedScope, selectedPurpose];
  };

  // called when sign message is done
  const callback = async (
    data: any,
    recoveredAddress: any,
    message: string
  ) => {
    const req = generateRequest();

    var body = {
      data: {
        patient: req[0],
        clinician: recoveredAddress,
        scope: req[1],
        purpose: req[2],
        message: message,
        state: "initiated",
        date: formatDate(new Date()),
        request_data: {
          type: resourceType,
          from: "Apple Health",
          date: formatDate(resourceDate),
        },
      },
    };
    
    if (data && recoverAddress) {
      await fetch("/api/couchdb/requests/new", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((res) => res.json())
        .then((json) => console.log(json));
    }
  };

  useEffect(() => {
    generateRequest(); // This is be executed when `loading` state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, scope, purpose]);

  return (
    <div>
      <div>
        <hr className="solid" />
        <h2>Request to Access Records</h2>
      </div>
      <div>
        <hr className="solid" />
        <h2>Patient email</h2>
        <input
          value={patient}
          onChange={(e) => setPatient(e.target.value)}
          placeholder="patient email"
          required
        />
        {/* <button type="submit" className="btn btn-submit">
          Search
        </button> */}
        <h3>Requested Data</h3>
        <div style={{ marginTop: "20px" }}>
          <button className="btn btn-accented">Steps</button>
          <button className="btn">Medication</button>
          <button className="btn">Vaccinations</button>
        </div>
        <h3>From</h3>
        <DatePicker
          selected={resourceDate}
          onChange={(date: Date) => setResourceDate(date)}
        />
        <hr className="solid" />
        <h2>Scope of access</h2>
        <ul className="ul-noformat">
          {/* @ts-ignore */}
          {scope.map((name, index) => {
            return (
              <li key={index}>
                <input
                  type="checkbox"
                  id={`custom-checkbox-${index}`}
                  name={name}
                  value={name}
                  checked={checkedScope[index]}
                  onChange={() => updateScope(index)}
                />
                <label htmlFor={`custom-checkbox-${index}`}>{name}</label>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <hr className="solid" />
        <h2>Purpose</h2>
        <ul className="ul-noformat">
          {/* @ts-ignore */}
          {purpose.map((name, index) => {
            return (
              <li key={index}>
                <input
                  type="checkbox"
                  id={`custom-checkbox-${index}`}
                  name={name}
                  value={name}
                  checked={checkedPurpose[index]}
                  onChange={() => updatePurpose(index)}
                />
                <label htmlFor={`custom-checkbox-${index}`}>{name}</label>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <hr className="solid" />
        <h2>Credential</h2>
        <p>
          Your etherium address will be used to access your verifiable
          credentials and to sign your request.
        </p>
        <Ethereum req={request} callback={callback}>
          <input
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="verifiable credential"
            required
          />
          <button type="submit" className="btn btn-submit">
            Search
          </button>
        </Ethereum>
      </div>
    </div>
  );
};

//@ts-ignore
function Ethereum(props) {
  const { isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  const { children, req, callback } = props;

  if (isConnected) {
    return (
      <div>
        <ConnectWallet />
        <p>1. Select a Verifiable Credential</p>
        {children}
        <p>2. Add Message</p>
        <SignMessage req={req} callback={callback}></SignMessage>
      </div>
    );
  }

  return <ConnectWallet />;
}

export default RequestAccess;
