import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import NextCors from "nextjs-cors";

//commands to kill couch db on mac
//sudo lsof -i :5984
//kill "PID"
var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN;

//Endpoint for clinicans to create requests for patient records in RS
//send data in body formated as :
// data: {
//     "patient": email,
//     "clinician": ETH address,
//     "scope": [], // Read, Update, Create
//     "purpose": [], // Clinical-routine, Clinical-emergency, Research, Customer support, Other
//     "message": "", // optional
//     "state": "initiated", // initiated, accepted-trustee, accepted-patient, completed
//     "date": date // date created
//     "request_data": {
//        "type": "Steps" // The type of data requested
//        "from": "Apple Health" // either apple health or url
//        "date": date //optional
//     } 
//     "reasorce_data": {} // the actual health data. This will be added later by patient. Ive included for dev purposes.
//   }


async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });
  const {data} = req.body

  if (!data) {
    res.status(500).send("Bad Request: missing items in request");
  }

  const rs_requests = await nano.use("rs_requests");
  try {
    const response = await rs_requests.insert(data)
    if (response.error) {
      res
        .status(500)
        .send({ error: response.error, reason: response.reason});
    }
    res.status(200).json(response);
  } catch (error) {
    console.log(5)
    res.status(500).send(error);
  }
}

export default handler;
