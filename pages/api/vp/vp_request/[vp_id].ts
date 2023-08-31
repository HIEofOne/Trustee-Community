import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import objectPath from 'object-path';

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
  const gnap = await nano.db.use("gnap");
  const {vp_id} = req.query;
  const q = {
    selector: {
      vp_id: {"$eq": vp_id}
    }
  };
  try {
    const response = await gnap.find(q);
    if (response.docs[0]) {
      if (objectPath.has(response, 'docs.0.vp_jwt')) {
        res.setHeader('content-type', 'application/jwt');
        res.status(200).send(response.docs[0].vp_jwt);
      } else {
        res.status(400).json({error: 'invalid_request'});
      }
    } else {
      res.status(400).json({error: 'invalid_request'});
    }
  } catch (e) {
    res.status(400).json({error: 'invalid_request'});
  }
}

export default handler;
