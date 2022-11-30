import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function getAllPatients(req: NextApiRequest, res: NextApiResponse) {
  //TODO - Fix Cors
  await NextCors(req, res, {
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });

  const patients = await nano.db.use("patients");
  try {
    const doclist = await patients.list()
    res.status(200).json(doclist)
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}

export default getAllPatients;
