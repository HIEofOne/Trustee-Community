import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';

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
  const {nonce} = req.body;
  const magic = await nano.db.use("magic");
  try {
    const response = await magic.get(nonce);
    if (response.verified !== 'true') {
      res.status(500).send({error: 'not verified'});
    } else {
      await magic.destroy(response._id, response._rev);
      res.status(200).json({success: true});
    }
  } catch (error){
    res.status(500).send(error);
  }
}

export default handler;