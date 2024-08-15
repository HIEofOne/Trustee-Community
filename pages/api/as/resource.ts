import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import verifySig from '../../../lib/verifySig';
import verifyJWT from '../../../lib/verifyJWT';
import objectPath from 'object-path';
import { v4 as uuidv4 } from 'uuid';

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
    methods: ["POST", "PUT", "DELETE"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  if (await verifySig(req)) {
    const gnap_resources = await nano.db.use("gnap_resources");
    let proceed = false;
    // body: {"access": [
    //  {
    //    "type": "resource name",
    //    "actions": ["read", "write", "delete"],
    //    "datatypes": ["image", "metadata", "json"],
    //    "identifier": "chart identifier",
    //    "locations": ["https://resource.server1.url", "https://resource.server2.url"],
    //    "privileges": ["email@of.resource.owner", "npi", "offline"],
    //    "ro": "email@of.resource.owner"
    //  },
    //  { ... }
    // ]}
    if (req.method === 'POST') {
      if (objectPath.has(req, 'body.access') && req.body.access.length > 0) {
        for (const a of req.body.access) {
          const doc = {
            type: a.type,
            actions: a.actions,
            locations: a.locations,
            datatypes: a.datatypes,
            resource_server: req.body.resource_server,
            identifier: a.identifier,
            privileges: a.privileges,
            ro: a.ro
          }
          const nonce = uuidv4();
          await gnap_resources.insert(doc, nonce);
        }
        res.status(200).json({success: true});
      } else {
        res.status(500).send("Invalid format")
      }
    }
    // body: {"resource": {
    //    "type": "resource name",
    //    "actions": ["read", "write", "delete"],
    //    "datatypes": ["image", "metadata", "json"],
    //    "identifier": "chart identifier",
    //    "locations": ["https://resource.server1.url", "https://resource.server2.url"],
    //    "privileges": ["email@of.resource.owner", "npi", "offline"],
    //    "ro": "email@of.resource.owner"
    //  }}
    if (req.method === 'PUT') {
      if (objectPath.has(req, 'body.access')) {
        if (req.headers['authorization'] !== undefined) {
          const jwt = req.headers['authorization'].split(' ')[1];
          if (await verifyJWT(jwt, objectPath.get(req, 'body.access.ro'))) {
            proceed = true;
          }
        }
        if (proceed) {
          try {
            const doc = await gnap_resources.get(req.body.access._id);
            objectPath.set(req, 'body.access._rev', doc._rev);
            await gnap_resources.insert(req.body.access);
            res.status(200).json({success: true});
          } catch (e) {
            res.status(401).send('Unauthorized');
          }
        } else {
          res.status(401).send('Unauthorized - verify JWT failed');
        }
      } else {
        res.status(500).send('Invalid format');
      }
    }
    if (req.method === 'DELETE') {
      if (objectPath.has(req, 'body.access')) {
        if (req.headers['authorization'] !== undefined) {
          const jwt = req.headers['authorization'].split(' ')[1];
          if (await verifyJWT(jwt, objectPath.get(req, 'body.access.ro'))) {
            proceed = true;
          }
        }
        if (proceed) {
          const doc = await gnap_resources.get(req.body.access._id);
          await gnap_resources.destroy(doc);
          res.status(200).json({success: true});
        } else {
          res.status(401).send('Unauthorized - verify JWT failed');
        }
      } else {
        res.status(500).send('Invalid format');
      }
    }
  } else {
    console.log('Unauthorized - verify signature failed')
    res.status(401).send('Unauthorized - verify signature failed');
  }
}

export default handler;
