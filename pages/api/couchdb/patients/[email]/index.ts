import { NextApiRequest, NextApiResponse } from "next";

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function getPatientFromEmail(req: NextApiRequest, res: NextApiResponse) {
  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email parameter");
  }
  console.log("email:", email)
  const patients = await nano.db.use("patients");
  try {
    const response = await patients.get(email)
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    res.status(200).json(response);
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}

export default getPatientFromEmail;