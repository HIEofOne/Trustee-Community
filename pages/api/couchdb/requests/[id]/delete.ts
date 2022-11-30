import { NextApiRequest, NextApiResponse } from "next";
var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

async function getResourceRequestFromId(req: NextApiRequest, res: NextApiResponse) {

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
    res.status(500).send(error);
  }
}

export default getResourceRequestFromId;
