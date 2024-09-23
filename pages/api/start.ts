import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import objectPath from 'object-path';
import * as jose from 'jose';
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const dbs = ["patients", "gnap", "gnap_resources", "gnap_policies", "gnap_public_keys", "keys", "magic"];
  const dbs_final = [];
  for (const db of dbs) {
    const checkdb = nano.db.use(db);
    try {
      await checkdb.info();
      dbs_final.push({db: db, status: 'exists'});
    } catch (e) {
      const create = await nano.db.create(db);
      if (db === "keys") {
        const alg = 'RS256';
        const { publicKey, privateKey } = await jose.generateKeyPair(alg);
        const public_key = await jose.exportJWK(publicKey);
        const kid = uuidv4();
        objectPath.set(public_key, 'kid', kid);
        objectPath.set(public_key, 'alg', alg);
        const private_key = await jose.exportJWK(privateKey);
        objectPath.set(private_key, 'kid', kid);
        objectPath.set(private_key, 'alg', alg);
        console.log(public_key)
        console.log(private_key)
        const keys = nano.db.use("keys");
        const doc = {_id: uuidv4(), publicKey: public_key, privateKey: private_key}
        const response = await keys.insert(doc);
        dbs_final.push({db: db, status: create, keys_status: response});
      } else {
        dbs_final.push({db: db, status: create});
      }
    }
  }
  res.status(200).json(dbs_final);
}

export default withIronSessionApiRoute(handler, {
  cookieName: 'siwe',
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
})

