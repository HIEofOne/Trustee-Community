import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
var admin_email = process.env.ADMIN_EMAIL;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const new_pt_body = {
    user: {
        display: req.body.first_name + ' ' + req.body.last_name,
        email: req.body.email,
        did: null
    },
    patient: {
        lastname: req.body.last_name,
        firstname: req.body.first_name,
        dob: req.body.dob,
        gender: req.body.gender,
        birthgender: req.body.birthGender
    },
    pin: req.body.pin
  }
  // const opts = {headers: {Authorization: 'Bearer ' + do_token, Accept: 'application/json'}};
  const new_pt = await axios.post(process.env.APP_URL + '/auth/addPatient', new_pt_body, {timeout: 120000});
  const url_full = new_pt.data.url;
  const doc_patient = await patients.get(req.body.email);
  doc_patient.phr = url_full;
  doc_patient.resource_server = new_pt.data.patient_id;
  await patients.insert(doc_patient);
  const htmlContent = fs.readFileSync(path.join(process.cwd(), 'public', 'email.html'), 'utf-8');
  const htmlFinal = htmlContent.replace(/[\r\n]+/gm, '')
    .replace('@title', 'HIE of One - New Account Confirmation')
    .replace('@previewtext', 'Your HIE of One Trustee Account has been created!')
    .replace('@paragraphtext', 'An HIE of One Trustee Account has been created for ' + req.body.email)
    .replace('@2paragraphtext', '')
    .replaceAll('@link', url_full)
    .replace('@buttonstyle', 'display:block')
    .replace('@buttontext', 'Your Personal Health Record');
  const htmlFinal1 = htmlContent.replace(/[\r\n]+/gm, '')
    .replace('@title', 'HIE of One - New Account Confirmation')
    .replace('@previewtext', 'An HIE of One Trustee Account has been created!')
    .replace('@paragraphtext', 'An HIE of One Trustee Account has been created for ' + req.body.email + `. <a href="${domain}/myTrustee">Your HIE of One Trustee Account Dashboard</a>`)
    .replace('@2paragraphtext', '')
    .replaceAll('@link', url_full)
    .replace('@buttonstyle', 'display:block')
    .replace('@buttontext', 'Link to their Personal Health Record');
  const sendmail = await fetch(domain + "/api/sendmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: req.body.email,
      subject: "HIE of One - New Account Confirmation",
      html: htmlFinal
      // html: `<div><h1>Your HIE of One Trustee Account has been created!</h1><h2><a href="${domain}/myTrustee">Your HIE of One Trustee Account Dashboard</a></h2><h2><a href="${url_full}">Your Personal Health Record</a></h2></div>`,
    })
  });
  const { error } = await sendmail.json();
  const sendmail1 = await fetch(domain + "/api/sendmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: admin_email,
      subject: "HIE of One - New Account Confirmation",
      html: htmlFinal1
      // html: `<div><h1>An HIE of One Trustee Account has been created for ${req.body.email}</h1><h2><a href="${url_full}">Link to their Personal Health Record</a></h2></div>`,
    })
  });
  const { error1 } = await sendmail1.json();
  if (error) {
    console.log(error)
    res.status(500).send(error);
  } else if (error1) {
    console.log(error)
    res.status(500).send(error1);
  } else {
    res.send({url: url_full, error: ''});
  }
}

export default withIronSessionApiRoute(handler, {
  cookieName: 'siwe',
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
})