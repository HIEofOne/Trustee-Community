import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);

async function records(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const {id} = req.query
  if (!id) {
    res.status(500).send("Bad Request: missing id param");
  }
  const rs_requests = nano.use("rs_requests");
  try {
    const response = await rs_requests.get(id);
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send(error);
  }
}

export default records;
