import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const gnap = nano.db.use("gnap");
  const {id} = req.body;
  const q = {
    selector: {
      'interact_nonce.value': {"$eq": id}
    }
  };
  try {
    const response = await gnap.find(q);
    if (response.docs[0]) {
      if (objectPath.has(response, 'docs.0.vp_status')) {
        if (response.docs[0].vp_status === 'complete') {
          res.status(200).json({success: true, vc: response.docs[0].vc});
        } else {
          res.status(200).json({success: false});
        }
      } else {
        res.status(200).json({success: false});
      }
    } else {
      res.status(200).json({success: false});
    }
  } catch (error) {
    res.status(200).json({success: false});
  }
}

export default handler;

