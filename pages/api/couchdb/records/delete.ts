import { NextApiRequest, NextApiResponse } from "next";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function deleteRecord(req: NextApiRequest, res: NextApiResponse) {

  const {email, recordId} = req.body
  if (!email || !recordId) {
    res.status(500).send("Bad Request: missing items in body");
  }

  const patients = nano.use("patients");
  try {
    const doc = await patients.get(email);
    const rev = doc._rev
    delete doc.records[recordId - 1]
    doc.records = doc.records.filter((item:any) => item)
    const response = await patients.insert({_id:email, _rev: rev, records: doc.records} )

    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason});
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default deleteRecord;
