import { NextApiRequest, NextApiResponse } from "next";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function newRecourceRequest(req: NextApiRequest, res: NextApiResponse) {

  const { data } = req.body;
  if (!data) {
    res.status(500).send("Bad Request: missing items in request");
  }

  const rs_requests = await nano.db.use("rs_requests");
  try {
    const response = await rs_requests.insert(data);
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send(error);
  }
}

export default newRecourceRequest;
