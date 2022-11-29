import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import NextCors from "nextjs-cors";

//commands to kill couch db on mac
//sudo lsof -i :5984
//kill "PID"
var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `://${user}:${pass}@couchdb.` + url.hostname);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["DELETE"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });

  const {email, recordId} = req.body
  if (!email || !recordId) {
    res.status(500).send("Bad Request: missing items in body");
  }
  const patients = nano.use("patients");
  try {
    const doc = await patients.get(email);
    const rev = doc._rev
    console.log(doc,recordId)
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
    console.log(5)
    res.status(500).send(error);
  }
}

export default handler;
