import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const {email, data} = req.body
  if (!email || !data) {
    res.status(500).send("Bad Request: missing items in body");
  }
  const patients = nano.use("patients");
  try {
    const response = await patients.get(email);
    const rev = response._rev
    if (response.records) {
      response.records[data.id - 1] = data
      patients.insert({_id:email, _rev: rev, records: response.records} )
    } else {
      patients.insert({_id:email, _rev: rev, records: [data]} )
    }
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason});
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default handler;
