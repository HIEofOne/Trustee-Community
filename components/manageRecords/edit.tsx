import Link from "next/link";
import React, { useEffect, useState } from "react";
import records from "../../pages/api/couchdb/records/[email]";

export default function Edit(props:any) {
  const { data, cancel } = props;

  const [recordName, setRecordName] = useState("");
  const [resourceURL, setResourceURL] = useState("");
  const [newRecord, setNewRecord] = useState(true);
  const [userRecordCount, setUserRecordCount] = useState(0)

  //Checkboxes
  //Scope
  var scope = ["Read", "Update", "Create"];
  const [checkedScope, setCheckedScope] = useState(
    new Array(scope.length).fill(false)
  );
  const updateScope = (position: number) => {
    const updated = checkedScope.map((item, index) =>
      index === position ? !item : item
    );
    setCheckedScope(updated);
  };
  //Purpose
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
  const updatePurpose = (position: number) => {
    const updated = checkedPurpose.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedPurpose(updated);
  };

  // Check for record data and display it
  // When page loads
  useEffect(() => {

    getUserRecordCount()
    // To initate a new empty record
    // pass data="new"
    if (!props.data.new && newRecord) {
      // assigning state variables
      setNewRecord(false);
      setRecordName(props.data.name); // record name
      setResourceURL(props.data.url); // recource url
      //Scope
      const data_scope = props.data.scope
      const index_scope = data_scope.map((item: string) => {
        // find indexs and update
        return scope.indexOf(item);
      });
      var n = 0;
      const updated_scope = checkedScope.map((item, index) => {
        if (index == index_scope[n]) {
          n++;
          return true;
        }
      });
      setCheckedScope(updated_scope);
      //Purpose
      const data_purpose = props.data.purpose
      const index_purpose = data_purpose.map((item: string) => {
        // find indexs and update
        return purpose.indexOf(item);
      });
      n = 0;
      const updated_purpose = checkedPurpose.map((item, index) => {
        if (index == index_purpose[n]) {
          n++;
          return true;
        }
      });
      setCheckedPurpose(updated_purpose);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const getUserRecordCount = async () => {
    fetch("/api/couchdb/records/" + props.email, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.records) {
          setUserRecordCount(json.records.length)
        } else {
          setUserRecordCount(0)
        }
      });
  };

    //save / update couch db
    const saveRecord = async(duplicate: Boolean) => {
      //update json object with edited values
      var update = data;
      if (newRecord || duplicate) {
        console.log(userRecordCount)
        update = {
          "id": duplicate ? (userRecordCount + 1) : data.id,
          "date": new Date().toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"}),
          "credential": "NPI - Verified by Doximity - issued by trustee.health"
        }
      }
      console.log(update)
      update.name = recordName;
      update.url = resourceURL;
      //Format scope and purpose
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
      update.scope = selectedScope
      update.purpose = selectedPurpose
  
      //Request body
      const body = {
          "email" : props.email,
          "record": update
      }
      //Update couchdb
      fetch("/api/couchdb/records/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
              cancel("manageRecords")
          }
        });

        //TODO - update keys of record list in ManageRecords index
    };

    const deleteRecord = () => {
      const body = {
        "email" : props.email,
        "recordId": data.id
    }
    //Update couchdb
    fetch("/api/couchdb/records/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
            cancel("manageRecords")
        }
      });
    }

  return (
    <div>
      <div>
        <hr className="solid" />
        <h2>Access Policy for Record #{data.id}</h2>
        <input
          style={{ marginBottom: "10px", width: "100%", maxWidth: "400px" }}
          placeholder="Record Name"
          onChange={(e) => setRecordName(e.target.value)}
          value={recordName}
        ></input>
        <br />
        <input
          style={{ marginBottom: "10px", width: "100%", maxWidth: "400px" }}
          placeholder="Recource URL"
          onChange={(e) => setResourceURL(e.target.value)}
          value={resourceURL}
        ></input>
        <br />
        <a target="_blank" href={resourceURL} rel="noopener noreferrer" style={{padding: 0}}>
          <button className="btn">Preview</button>
        </a>
        <button className="btn" onClick={() => saveRecord(true)}>Duplicate</button>
        <button className="btn" onClick={() => deleteRecord()}>Delete</button>
      </div>
      <div>
        <hr className="solid" />
        <h2>Scope</h2>
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
        <br />
        <button className="btn" onClick={() => cancel("manageRecords")}>Cancel</button>
        <button className="btn btn-accented" onClick={() => saveRecord(false)}>
          {newRecord? "Save new record access policy" : "Update your records access policies"}
        </button>
      </div>
    </div>
  );
}
