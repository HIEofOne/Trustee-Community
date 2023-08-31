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
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const gnap_resources = await nano.db.use("gnap_resources");
  const q = {
    selector: {
      "ro": {"$eq": req.body.email},
      "type": {$regex: '(?i)' + req.body.filter}
    }
  };
  try {
    const response = await gnap_resources.find(q);
    if (response.docs[0]) {
      res.status(200).json(response.docs)
    } else {
      res.status(200).json([])
    }
  } catch (e) {
    console.log(e)
    res.status(200).json([])
  }
}

export default handler;
