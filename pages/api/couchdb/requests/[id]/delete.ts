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
    methods: ["DELETE"],
    origin: serverRuntimeConfig.DOMAIN,
    optionsSuccessStatus: 200,
  });

  const {id} = req.query
  if (!id) {
    res.status(500).send("Bad Request: missing id param");
  }
  
  const rs_requests = nano.use("rs_requests");
  try {
    const doc = await rs_requests.get(id);
    const rev = doc._rev
    const response = await rs_requests.destroy(id, rev)

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
