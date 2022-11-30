import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function patientAcceptTerms(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });
  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email param");
  }
  const patients = await nano.db.use("patients");
  try {
    const response = await patients.get(email);
    response.acceptsTerms = true
    patients.insert(response)
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    //account succesfully created
    //Send confirmation email
    //** Insecure -- email needs to be encripted to prevent middle man attacks
    const sendgrid = await fetch(domain + "/api/sendgrid", {
        body: JSON.stringify({
          email: req.body.email,
          subject: "HIE of One - Account Confirmation",
          html: `<div><h1>Your HIE of One Trustee Account has been created!</h1><h1><a href=${domain}/myTrustee>Your Account</a></h1></div>`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      
      const { error } = await sendgrid.json();
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
