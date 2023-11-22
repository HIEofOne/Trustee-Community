import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function patientAcceptTerms(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const {email} = req.query;
  if (!email) {
    res.status(500).send("Bad Request: missing email parameter");
  }
  const patients = await nano.db.use("patients");
  try {
    const response = await patients.get(email);
    response.acceptsTerms = true;
    await patients.insert(response);
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    //Account succesfully created, send confirmation email
    //** Insecure -- email needs to be encripted to prevent middle man attacks
    const sendmail = await fetch(domain + "/api/sendmail", 
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.body.email,
        subject: "HIE of One - Account Confirmation",
        html: `<div><h1>Your HIE of One Trustee Account has been created!</h1><h1><a href=${domain}/myTrustee>Your Account</a></h1></div>`,
      })
    });
    const { error } = await sendmail.json();
    if (error) {
      console.log(error);
      res.status(500).send(error.message)
    }
    res.status(200).json({success: true});
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}

export default patientAcceptTerms;