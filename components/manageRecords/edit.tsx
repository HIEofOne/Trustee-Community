import React, { useEffect, useState } from "react";
import records from "../../pages/api/couchdb/records/[email]";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import { FormControl, List } from "@mui/material";
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

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
    "Clinical - Routine",
    "Clinical - Emergency",
    "Research",
    "Customer Support",
    "Other"
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
    await fetch("/api/couchdb/records/" + props.email, 
      { method: "GET", headers: {"Content-Type": "application/json"} })
      .then((res) => res.json()).then((json) => {
        if (json.records) {
          setUserRecordCount(json.records.length);
        } else {
          setUserRecordCount(0);
        }
      });
  };

  //save / update couch db
  const saveRecord = async(duplicate: Boolean) => {
    //update json object with edited values
    var update = data;
    if (newRecord || duplicate) {
      console.log(userRecordCount);
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
    await fetch("/api/couchdb/records/update", 
      { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json()).then((json) => {
        if (json.success) {
          cancel("manageRecords")
        }
      });

      //TODO - update keys of record list in ManageRecords index
  };

  const deleteRecord = async() => {
    const body = {
      "email" : props.email,
      "recordId": data.id
    }
    //Update couchdb
    await fetch("/api/couchdb/records/delete", { method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body) })
      .then((res) => res.json()).then((json) => {
        if (json.success) {
            cancel("manageRecords")
        }
      });
    };

  return (
    <div>
      <div>
        <h2>Access Policy for Record #{data.id}</h2>
        <Stack spacing={2}>
          <TextField
            variant="standard"
            label="Record Name"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            required />
          <TextField
            variant="standard"
            label="Recource URL"
            value={resourceURL}
            onChange={(e) => setResourceURL(e.target.value)}
            required />
          <Stack spacing={2} direction="row">
            <Button variant="contained" component="a" href={resourceURL}>Preview</Button>
            <Button variant="contained" onClick={() => saveRecord(true)}>Duplicate</Button>
            <Button variant="contained" onClick={() => deleteRecord()}>Delete</Button>
          </Stack>
        </Stack>
      </div>
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, pb: 2 }}>
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            <Typography variant="h5">Scope</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <FormGroup>
                {scope.map((name, index) => {
                  return (
                    <FormControlLabel key={index} label={name} control={<Checkbox id={`custom-checkbox-${index}`}
                      name={name}
                      value={name}
                      checked={checkedScope[index]}
                      onChange={() => updateScope(index)} />} />
                  );
                })}
              </FormGroup>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            <Typography variant="h5">Purpose</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <FormGroup>
                {purpose.map((name, index) => {
                  return (
                    <FormControlLabel key={index} label={name} control={<Checkbox id={`custom-checkbox-${index}`}
                      name={name}
                      value={name}
                      checked={checkedPurpose[index]}
                      onChange={() => updatePurpose(index)} />} />
                  );
                })}
              </FormGroup>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <div>
        <Stack spacing={2} direction="row">
          <Button variant="contained" onClick={() => cancel("manageRecords")}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => saveRecord(false)}>
            {newRecord? "Save new record access policy" : "Update your records access policies"}
          </Button>
        </Stack>
      </div>
    </div>
  );
}
