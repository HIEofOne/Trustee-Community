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

//endpoint to update request progress
//currently only stupports updates to state and data variables

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });

  const {id} = req.query
  const {state, data} = req.body

  if (!id || !state) {
    res.status(500).send("Bad Request: missing items in request");
  }

  const rs_requests = await nano.use("rs_requests");
  try {
    //get request rev id
    const doc = await rs_requests.get(id);
    doc.state = state 
    doc.data = data 
    var response = await rs_requests.insert(doc ) 
    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason});
    }
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default handler;
