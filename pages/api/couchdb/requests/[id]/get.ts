import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import NextCors from "nextjs-cors";

//commands to kill couch db on mac
//sudo lsof -i :5984
//kill "PID"
var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);

async function records(req: NextApiRequest, res: NextApiResponse) {

  await NextCors(req, res, {
    // Options
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });

  const {id} = req.query
  if (!id) {
    res.status(500).send("Bad Request: missing id param");
  }
  
  const rs_requests = nano.use("rs_requests");
  try {
    const response = await rs_requests.get(id);
    console.log(response)
    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason });
    }
    res.status(200).json(response);
  } catch (error) {
    console.log(5)
    res.status(500).send(error);
  }
}

export default records;
