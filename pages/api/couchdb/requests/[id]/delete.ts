import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

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
    methods: ["DELETE"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const {id} = req.query
  if (!id) {
    res.status(500).send("Bad Request: missing id param");
  }
  const rs_requests = nano.use("rs_requests");
  try {
    const doc = await rs_requests.get(id);
    const rev = doc._rev
    const response = await rs_requests.destroy(id, rev)
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason});
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default handler;
