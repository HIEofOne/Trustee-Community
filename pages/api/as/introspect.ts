import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import verifySig from '../../../lib/verifySig';
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
    methods: ["POST"],
    origin: '*',
    optionsSuccessStatus: 200
  });
  if (await verifySig(req)) {
    const gnap = await nano.db.use("gnap");
    const { access_token } = req.body;
    const q = {
      selector: {
        "access_token.value": {"$eq": access_token}
      }
    };
    const response = {"active": false};
    try {
      const result = await gnap.find(q);
      if (result.docs[0]) {
        objectPath.set(response, 'active', true);
        objectPath.set(response, 'access', result.docs[0].access);
        res.status(200).json(response);
      } else {
        res.status(200).json(response);
      }
    } catch (e) {
      res.status(200).json(response);
    }
  } else {
    res.status(401).send('Unauthorized');
  }
}

export default handler;
