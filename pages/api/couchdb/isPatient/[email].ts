import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

//commands to kill couch db
// sudo lsof -i :5984
//kill "PID"

// API endpoint to determine if email is already signed up
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });
  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email param");
  }
  console.log(email)
  const patients = await nano.db.use("patients");
  console.log(patients)
  try {
    const responce = await patients.get(email)
    console.log(responce);
    if (responce.error) {
      res.status(500).send({ error: responce.error, reason: responce.reason });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}

export default handler;
