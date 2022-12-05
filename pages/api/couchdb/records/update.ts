import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import NextCors from "nextjs-cors";
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

//commands to kill couch db on mac
//sudo lsof -i :5984
//kill "PID"
var user = serverRuntimeConfig.NEXT_PUBLIC_COUCH_USERNAME;
var pass = serverRuntimeConfig.NEXT_PUBLIC_COUCH_PASSWORD;
const domain: string = serverRuntimeConfig.DOMAIN !== undefined ? serverRuntimeConfig.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["PUT"],
    origin: serverRuntimeConfig.DOMAIN,
    optionsSuccessStatus: 200,
  });

  const {email, data} = req.body
  if (!email || !data) {
    res.status(500).send("Bad Request: missing items in body");
  }

  const patients = nano.use("patients");
  try {
    const response = await patients.get(email);
    console.log(response)
    const rev = response._rev
    if (response.records) {
      response.records[data.id - 1] = data
      patients.insert({_id:email, _rev: rev, records: response.records} )
    } else {
      patients.insert({_id:email, _rev: rev, records: [data]} )
    }
    
    console.log(3)
    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason});
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(5)
    res.status(500).send(error);
  }
}

export default handler;
