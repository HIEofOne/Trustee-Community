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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const keys = await nano.db.use("keys");
  const keyList = await keys.list();
  const key = await keys.get(keyList.rows[0].id);
  res.status(200).json({"key": key.publicKey});
}

export default handler;
