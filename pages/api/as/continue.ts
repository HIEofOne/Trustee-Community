import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import crypto from 'crypto';
import verifySig from "../../../lib/verifySig";
import parseSig from "../../../lib/parseSig";
import { access } from "fs";

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  if (await verifySig(req)) {
    const parsed = parseSig(req);
    const now = Math.floor(Date.now() / 1000);
    const test = parseInt(parsed.created) + 30;
    if (test <= now) {
      const gnap = await nano.db.use("gnap");
      var access_token = <string>req.headers['authorization'];
      try {
        const gnap_result = gnap.get(access_token.replace('GNAP ', ''));
        res.status(200).json({ success: true });
      } catch (e) {
        res.status(401).send('Unauthorized');
      }
    } else {
      res.status(401).send('Unauthorized');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
  
  const {email} = req.query
  if (!email) {
    res.status(500).send("Bad Request: missing email parameter");
  }
  const patients = await nano.db.use("patients");
  try {
    const response = await patients.get(email)
    console.log(response);
    if (response.error) {
      res.status(500).send({ error: response.error, reason: response.reason });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
}

export default handler;
