import { withIronSessionApiRoute } from 'iron-session/next';
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
  const {id, email} = req.body;
  const users = nano.db.use("patients");
  const user_doc = await users.get(email);
  const gnap = nano.db.use("gnap");
  const q = {
    selector: {
      'interact_nonce.value': {"$eq": id}
    }
  };
  if (objectPath.has(user_doc, 'vc')) {
    try {
      const response = await gnap.find(q);
      if (response.docs[0]) {
        const gnap_doc = response.docs[0];
        if (objectPath.has(gnap_doc, 'vc')) {
          res.status(200).json({success: true, vc: objectPath.get(gnap_doc, 'vc'), doc: gnap_doc});
        } else {
          const user_vc = objectPath.get(user_doc, 'vc');
          objectPath.set(gnap_doc, 'vc', user_vc);
          const insert = await gnap.insert(gnap_doc);
          objectPath.set(gnap_doc, '_rev', insert.rev);
          res.status(200).json({success: true, vc: objectPath.get(gnap_doc, 'vc'), doc: gnap_doc});
        }
      } else {
        res.status(200).json({success: false});
      }
    } catch (error) {
      res.status(200).json({success: false});
    }
  } else {
    res.status(200).json({success: true, message: 'No Verifiable Credentials'})
  }
  
}

export default withIronSessionApiRoute(handler, {
  cookieName: 'siwe',
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
})

