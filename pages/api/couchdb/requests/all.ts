import { NextApiRequest, NextApiResponse } from "next";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function getAllRequests(req: NextApiRequest, res: NextApiResponse) {
  
  const requests = await nano.use("rs_requests");
  try {
    const response = await requests.list()
    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason });
    }
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).send(error);
  }
}

export default getAllRequests;
