import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';

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
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const gnap = await nano.db.use("gnap");
  const doc = req.body;
  try {
    const response = await gnap.insert(doc);
    if (response.error) {
      res.status(500).send({error: response.error, reason:response.reason});
    }
    res.status(200).json({success: true});
  } catch (error){
    res.status(500).send(error);
  }
}

export default handler;
