import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import objectPath from 'object-path'

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
  const { doc } = req.body
  if (!doc) {
    res.status(200).json({error: "Bad Request: missing items in body"});
  }
  const gnap_resources = await nano.use("gnap_resources");
  let locations = [];
  let data = null;
  let error = {};
  if (objectPath.has(doc, 'locations')) {
    locations = objectPath.get(doc, 'locations');
  } else {
    res.status(200).json({error: "Bad Request: missing locations in access object"});
  }
  for (const location of locations) {
    const q = {
      selector: {
        location: {"$eq": location}
      }
    };
    try {
      const response = await gnap_resources.find(q);
      if (response.docs[0]) {
        data = response.docs[0];
      }
      if (response.error) {
        error = { error: response.error, reason: response.reason};
      }
    } catch (e) {
      console.log(error)
      error = { error: 'pouchDB failure', reason: e};
    }
    if (data !== null) {
      res.status(200).json({success: data});
    } else {
      res.status(200).json({error: error});
    }
  }
}

export default handler;
