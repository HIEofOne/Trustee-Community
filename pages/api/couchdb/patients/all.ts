import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);

async function getAllPatients(req: NextApiRequest, res: NextApiResponse) {
  //TODO - Fix Cors
  await NextCors(req, res, {
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const patients = await nano.db.use("patients");
  try {
    const doclist = await patients.list();
    res.status(200).json(doclist);
  } catch (error) {
    res.status(500).send(error);
  }
}

export default getAllPatients;