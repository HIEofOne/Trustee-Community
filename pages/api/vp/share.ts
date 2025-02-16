import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';
import objectPath from 'object-path';
import { v4 as uuidv4 } from 'uuid';
import { createAuthRequest } from '../../../lib/rp';

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
  const vp_id = uuidv4();
  const doc = await gnap.get(req.body._id);
  objectPath.set(doc, 'vp_id', vp_id);
  objectPath.set(doc, 'vc_type', req.body.vc_type);
  try {
    const nonce = uuidv4();
    const state = uuidv4();
    objectPath.set(doc, 'vp_state', state);
    objectPath.set(doc, 'vp_nonce', nonce);
    objectPath.set(doc, 'vp_status', 'pending');
    const url_req = url.protocol + "//" + url.hostname + "/api/vp/vp_request/" + vp_id;
    const link = "openid-vc://?request_uri=" + encodeURIComponent(url_req);
    const vp_jwt = await createAuthRequest(nonce, state, doc.vc_type, doc.vp_id);
    objectPath.set(doc, 'vp_jwt', vp_jwt)
    try {
      const response = await gnap.insert(doc);
      if (response.error) {
        res.status(500).send({error: response.error, reason:response.reason});
      }
      res.status(200).json({success: true, link: link, rev: response.rev});
    } catch (error){
      res.status(500).send(error);
    }
  } catch (e) {
    console.log(e)
  }
}

export default handler;
