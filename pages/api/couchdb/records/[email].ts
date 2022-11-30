import { NextApiRequest, NextApiResponse } from "next";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function getRecordsFromEmail(req: NextApiRequest, res: NextApiResponse) {

  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email param");
  }
  
  const patients = nano.use("patients");
  try {
    const response = await patients.get(email);
    const records = response.records;
    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason });
    }
    res.status(200).json({ records: records });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default getRecordsFromEmail;
