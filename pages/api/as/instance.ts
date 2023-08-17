import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

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
  const { id } = req.body;
  if (!id) {
    res.status(200).json({error: "Bad Request: missing items in body"});
  } else {
    const gnap = await nano.use("gnap");
    const q = {
      selector: {
        "interact_nonce.value": {"$eq": id}
      }
    };
    try {
      const response = await gnap.find(q);
      if (response.docs[0]) {
        if (response.docs[0].state === 'pending') {
          res.status(200).json({ success: response.docs[0] });
        } else {
          res.status(200).json({ error: "no record" });
        }
      } else {
        res.status(200).json({ error: "no record" });
      }
    } catch (error) {
      res.status(200).json(error);
    }
  }
}

export default handler;
