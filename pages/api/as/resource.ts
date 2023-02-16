import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import crypto from 'crypto';
import verifySig from "../../../lib/verifySig";
import parseSig from "../../../lib/parseSig";
import objectPath from 'object-path'

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
  if (await verifySig(req)) {
    const gnap_resources = await nano.db.use("gnap_resources");
    // associate patient email to resource before insertion
    for (var a of req.body.access) {
      const doc = {
        type: a.type,
        actions: a.actions,
        datatypes: a.datatypes,
        resource_server: req.body.resource_server,
        allow: []
      }
      for (var b of req.body.access.locations) {
        const doc1 = JSON.parse(JSON.stringify(doc))
        objectPath.set(doc1, 'location', b);
        const nonce = crypto.randomBytes(16).toString('base64url');
        await gnap_resources.insert(doc1, nonce);
      }
    }
  } else {
    res.status(401).send('Unauthorized');
  }
}

export default handler;
