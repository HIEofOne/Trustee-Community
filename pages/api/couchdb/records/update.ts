import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../../lib/cors';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const {email, record} = req.body
  if (!email || !record) {
    res.status(500).send("Bad Request: missing items in body");
  }
  const patients = await nano.use("patients");
  try {
    const response = await patients.get(email);
    const rev = response._rev
    if (response.records) {
      response.records[record.id - 1] = record
      await patients.insert({_id:email, _rev: rev, records: response.records} )
    } else {
      await patients.insert({_id:email, _rev: rev, records: [record]} )
    }
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason});
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

export default handler;
