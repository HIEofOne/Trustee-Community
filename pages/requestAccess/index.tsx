import Link from "next/link";
import * as React from "react";
import { useEffect, useState } from "react";
import { Profile } from "../../components/profile";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectWallet } from "../../components/connectWallet";
import SignMessage from "../../components/signMessage";
// import SignInWithEthereum from "../../components/SignInWithEthereum";

//Landing Page
const RequestAccess = () => {
  const [patient, setPatient] = useState("");
  const [credential, setCredential] = useState("");
  const [request, setRequest] = useState("");

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

  //@ts-ignore
  const updateScope = (position) => {
    const updated = checkedScope.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedScope(updated);
  };
  //@ts-ignore
  const updatePurpose = (position) => {
    const updated = checkedPurpose.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedPurpose(updated);
  };

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

    var request = `Requesting to access records from a patient in the HIE of One Community. The content of this request are as follows:
    
Patient: ${patient}
Scope: ${selectedScope}
Purpose: ${selectedPurpose}`;
    setRequest(request);
  };

  useEffect(() => {
    generateRequest(); // This is be executed when `loading` state changes
  }, [patient, scope, purpose]);

  return (
    <div>
      <div>
        <hr className="solid" />
        <h2>Request to Access Records</h2>
      </div>
      <div>
        <hr className="solid" />
        <h2>Patient record address and Scope of access</h2>
        <input
          value={patient}
          onChange={(e) => setPatient(e.target.value)}
          placeholder="name, email, ect..."
          required
        />
        <button type="submit" className="btn btn-submit">
          Search
        </button>
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
        <Ethereum message={request}>
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

  const { children, message } = props;

  if (isConnected) {
    return (
      <div>
        <ConnectWallet />
        <p>1. Select a Verifiable Credential</p>
        {children}
        <p>2. Edit Message</p>
        <SignMessage message={message}></SignMessage>
      </div>
    );
  }

  return <ConnectWallet />;
}

export default RequestAccess;
