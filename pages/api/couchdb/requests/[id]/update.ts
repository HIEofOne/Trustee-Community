import { NextApiRequest, NextApiResponse } from "next";

var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

//endpoint to update request progress
//currently only supports updates to state and data variables

async function updateRequestAtId(req: NextApiRequest, res: NextApiResponse) {

  const {id} = req.query
  const {state, data} = req.body

  if (!id || !state) {
    res.status(500).send("Bad Request: missing items in request");
  }

  const rs_requests = await nano.use("rs_requests");
  try {
    const doc = await rs_requests.get(id);
    doc.state = state 
    doc.data = data 
    var response = await rs_requests.insert(doc) 
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

export default updateRequestAtId;
