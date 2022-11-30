import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function updateRecordWithEmail(req: NextApiRequest, res: NextApiResponse) {

  const data = req.body
  if (!data) {
    return res.status(500).send("Bad Request: missing items in data");
  }

  const patients = nano.use("patients");
  try {
    const patient = await patients.get(data.email);

    // update/add record at index (id)
    if (patient.records) {
      patient.records[data.record.id - 1] = data.record
    } else {
      patient.records = [data.record]
    }
    const result = await patients.insert(patient)

    if (result.error) {
      return res.status(500).send({ error: result.error, reason: result.reason});
    }
    
    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).send(error);
  }
}

export default updateRecordWithEmail;
