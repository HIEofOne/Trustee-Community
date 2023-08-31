import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import createJWT from '../../../lib/createJWT';
import verifySig from '../../../lib/verifySig';
import parseSig from '../../../lib/parseSig';
import objectPath from 'object-path';

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
    if (test >= now) {
      const { interact_ref } = req.body;
      const gnap = await nano.use("gnap");
      const q = {
        selector: {
          "interact_nonce.value": {"$eq": interact_ref}
        }
      };
      try {
        const response = await gnap.find(q);
        const req_token = <string>req.headers['authorization'];
        const req_token_final = req_token.replace('GNAP ', '');
        if (response.docs[0] && response.docs[0].access_token.value === req_token_final) {
          if (response.docs[0].state === 'approved') {
            try {
              const jwt = await createJWT(response.docs[0]);
              res.status(200).json(jwt);
            } catch (e) {
              res.status(200).json(e);
            }
          } else if (response.docs[0].state === 'pending') {
            if (objectPath.has(response, 'docs.0.pending_resources')) {
              res.status(200).json({
                "continue": {
                  "access_token": {
                    "value": response.docs[0].access_token.value
                  },
                  "uri": url.protocol + "//" + url.hostname + "/api/as/continue",
                  "wait": 30
              }});
            } else {
              const pending_resources = [];
              for (var a of response.docs[0].access_token.access.locations) {
                const gnap_resources = await nano.db.use("gnap_resources");
                const r = {
                  selector: {
                    "locations": {"$elemMatch": {"$eq": a}},
                    "actions": {"$eq": response.docs[0].access_token.access.actions}
                  }
                };
                try {
                  const resource_docs = await gnap_resources.find(r);
                  for (var resource_doc of resource_docs.docs) {
                    pending_resources.push(resource_doc);
                  }
                } catch (e) {
                  console.log(e);
                }
              }
              objectPath.set(response, 'docs.0.pending_resources', pending_resources);
              await gnap.insert(response.docs[0]);
              const sendgrid = await fetch(domain + "/api/sendgrid", 
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: req.body.email,
                  subject: "HIE of One - Resource Privilege Request",
                  html: `<div><h1>HIE of One Trustee Resource Privilege Request</h1><h2><a href="${domain}/review/${response.docs[0].interact_nonce.value}">New Privileges Requested for your Resources</a></h2></div>`,
                })
              });
              const { error } = await sendgrid.json();
              if (error) {
                res.status(500).send(error.message);
              } else {
                res.status(200).json({
                  "continue": {
                    "access_token": {
                      "value": response.docs[0].access_token.value
                    },
                    "uri": url.protocol + "//" + url.hostname + "/api/as/continue",
                    "wait": 30
                }});
              }
            }
          } else {
            res.status(200).json({
              "error": {"code": "user_denied", "description": "The RO denied the request."},
              "continue": {
                "access_token": {
                  "value": response.docs[0].access_token.value
                },
                "uri": url.protocol + "//" + url.hostname + "/api/as/continue",
                "wait": 30
            }});
          }
        } else {
          res.status(200).json({"error": {"code": "invalid_continuation", "description": "The continuation of the referenced grant could not be processed."}});
        }
      } catch (e) {
        res.status(200).json({"error": {"code": "invalid_interaction", "description": "The client instance has provided an interaction reference that is incorrect for this request or the interaction modes in use have expired."}});
      }
    } else {
      res.status(200).json({"error": {"code": "too_fast", "description": "The client instance did not respect the timeout in the wait response before the next call."}});
    }
  } else {
    res.status(200).json({"error": {"code": "invalid_client", "description": "The request was made from a client that was not recognized or allowed by the AS, or the client's signature validation failed."}});
  }
}

export default handler;
