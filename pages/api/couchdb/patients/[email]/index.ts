import { NextApiRequest, NextApiResponse } from "next";
var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;


async function getPatientFromEmail(req: NextApiRequest, res: NextApiResponse) {
  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email param");
  }
  console.log("email:", email)
  const patients = await nano.db.use("patients");
  try {
    const responce = await patients.get(email)
    if (responce.error) {
      res.status(500).send({ error: responce.error, reason: responce.reason });
    }
    res.status(200).json(responce);
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}

export default getPatientFromEmail;
