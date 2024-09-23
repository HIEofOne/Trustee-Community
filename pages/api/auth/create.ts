import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import moment from 'moment';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

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
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const magic = await nano.db.use("magic");
  try {
    const nonce = Buffer.from(randomBytes(16)).toString('base64url');
    const expires = moment().add(20, 'minutes').unix();
    const response = await magic.insert(
      { email: req.body.email, nonce: nonce, expires: expires, verified: 'false' },
      nonce
    );
    if (response.error) {
      res.status(500).send({error: response.error, reason:response.reason});
    }
    const url_full = domain + '/verify/' + nonce;
    const htmlContent = fs.readFileSync(path.join(process.cwd(), 'public', 'email.html'), 'utf-8');
    const htmlFinal = htmlContent.replace(/[\r\n]+/gm, '')
      .replace('@title', 'HIE of One - Email Verification')
      .replace('@previewtext', 'HIE of One - Email Verification')
      .replace('@paragraphtext', 'Click on the button below to verify your email address with HIE of One Trustee.')
      .replace('@2paragraphtext', 'This button will expire in 20 minutes.')
      .replaceAll('@link', url_full)
      .replace('@buttontext', 'Verify');
    const sendmail = await fetch(domain + "/api/sendmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.body.email,
        subject: "HIE of One - Email Verification",
        html: htmlFinal
      })
    });
    res.status(200).json({success: true, nonce: nonce});
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}

export default handler;