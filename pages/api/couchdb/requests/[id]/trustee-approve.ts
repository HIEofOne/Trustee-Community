import { NextApiRequest, NextApiResponse } from "next";

const domain = process.env.DOMAIN;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {id} = req.query
  if (!id) {
    res.status(500).send("Bad Request: missing id param");
  }
  //get existing document
  const data = await fetch(`${domain}/api/couchdb/requests/${id}/get`, 
    { method: "GET", headers: {"Content-Type": "application/json"} })
    .then((res) => res.json());

  //TODO - verify with users access policies

  //set state to trustee aproved
  data.state = "trustee-approved"
  
  //update document
  const response = await fetch(`${domain}/api/couchdb/requests/${id}/update`, 
    { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data) })
    .then((res) => res.json());
  if (response.error) {
    res.status(500).send({ error: response.error, reason: response.reason});
  }
  res.status(200).json({ response });
}

export default handler;
