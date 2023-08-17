import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import objectPath from 'object-path';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
// const do_token: string = process.env.DIGITALOCEAN_API_TOKEN !== undefined ? process.env.DIGITALOCEAN_API_TOKEN: '';
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}
const patients = nano.db.use("patients");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const doclist = await patients.list({include_docs: true});
  const result_arr = [];
  for (var doc of doclist.rows) {
    if (objectPath.has(doc, 'doc.phr')) {
      const id = doc.doc.phr.split('/').slice(-1).join('');
      const body = {
        id: id,
        email: doc.doc._id
      }
      const result = await axios.post(process.env.APP_URL + '/auth/addResources', body);
      console.log(result.data);
      result_arr.push(result.data);
      console.log(result_arr);
    }
  }
  res.status(200).json(result_arr)
}

export default withIronSessionApiRoute(handler, {
  cookieName: 'siwe',
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
})