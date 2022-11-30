import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";


var user = process.env.NEXT_PUBLIC_COUCH_USERNAME;
var pass = process.env.NEXT_PUBLIC_COUCH_PASSWORD;
const nano = require("nano")(`http://${user}:${pass}@localhost:5984`);
const domain = process.env.DOMAIN


//commands to kill couch db
// sudo lsof -i :5984
//kill "PID"

async function newPatient(req: NextApiRequest, res: NextApiResponse) {  
  await NextCors(req, res, {
    // Options
    methods: ["PUT"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200,
  });
  
  const patients = nano.db.use("patients");
  try {
    const responce = await patients.insert(
      { email: req.body.email },
      req.body.email
    );
    if (responce.error) {
      res.status(500).send({error: responce.error, reason:responce.reason})
    }
    res.status(200).json({success: true})
  } catch (error){
    res.status(500).send(error)
  }
  
}


export default newPatient;
