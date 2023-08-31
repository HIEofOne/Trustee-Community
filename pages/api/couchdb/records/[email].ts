import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function records(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email param");
  }
  const patients = await nano.use("patients");
  try {
    const response = await patients.get(email);
    const records = response.records;
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    res.status(200).json({ records: records });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default records;
