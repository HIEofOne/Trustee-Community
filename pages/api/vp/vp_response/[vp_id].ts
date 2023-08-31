import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import * as jose from 'jose';
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
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const gnap = await nano.db.use("gnap");
  const patients = await nano.db.use("patients");
  const {state} = req.body;
  const q = {
    selector: {
      vp_state: {"$eq": state}
    }
  };
  try {
    const response = await gnap.find(q);
    if (response.docs[0]) {
      if (objectPath.has(response, 'docs.0.vp_jwt')) {
        const doc = response.docs[0];
        const patient_doc = await patients.get(doc.email);
        const payload = jose.decodeJwt(req.body.vp_token);
        if (objectPath.has(payload, 'vp.verifiableCredential')) {
          const vc = jose.decodeJwt(objectPath.get(payload, 'vp.verifiableCredential.0'));
          if (objectPath.has(doc, 'vc')) {
            const vc_arr = objectPath.get(doc, 'vc');
            vc_arr.push(vc);
            objectPath.set(doc, 'vc', vc_arr);
          } else {
            objectPath.set(doc, 'vc.0', vc);
          }
          objectPath.set(doc, 'vp_status', 'complete');
          await gnap.insert(doc);
          if (objectPath.has(patient_doc, 'vc')) {
            const vc_arr1 = objectPath.get(patient_doc, 'vc');
            vc_arr1.push(vc);
            objectPath.set(patient_doc, 'vc', vc_arr1);
          } else {
            objectPath.set(patient_doc, 'vc.0', vc);
          }
          await patients.insert(patient_doc);
          res.status(200).json({message: 'OK'});
        } else {
          res.status(400).json({error: 'invalid_token'});
        }
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
