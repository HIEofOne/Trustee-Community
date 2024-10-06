import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import { createHash } from 'crypto';
import objectPath from 'object-path';
import moment from 'moment';
import fs from 'fs';
import path from 'path';

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
  const { id, init } = req.body;
  if (!id && !init) {
    res.status(200).json({error: "Bad Request: missing items in body"});
  } else {
    const gnap = await nano.db.use("gnap");
    const patients = await nano.db.use("patients");
    const q = {
      selector: {
        "interact_nonce.value": {"$eq": id}
      }
    };
    try {
      const response = await gnap.find(q);
      if (response.docs[0]) {
        const request_doc = response.docs[0];
        const check_privileges = [];
        const pending_resources = [];
        const action_flag = [];
        // logic to determine access here
        for (const access of request_doc.access_token.access) {
          for (const a of access.locations) {
            const gnap_resources = await nano.db.use("gnap_resources");
            const r = {
              selector: {
                "locations": {"$elemMatch": {"$eq": a}}
              }
            };
            try {
              const resource_docs = await gnap_resources.find(r);
              for (const resource_doc of resource_docs.docs) {
                for (const action of access.actions) {
                  if (!resource_doc.actions.includes(action)) {
                    action_flag.push(action)
                  }
                }
                pending_resources.push(resource_doc);
                // check resource owner
                if (resource_doc.ro === request_doc.email) {
                  check_privileges.push({location: a, privilege: request_doc.email})
                }
                // check email
                if (resource_doc.privileges.includes(request_doc.email)) {
                  const patient_doc = await patients.get(request_doc.email);
                  if (objectPath.has(patient_doc, 'vc')) {
                    objectPath.set(request_doc, 'vc', patient_doc.vc);
                  }
                  check_privileges.push({location: a, privilege: request_doc.email});
                }
                // check npi
                if (check_privileges.length === 0) {
                  if (resource_doc.privileges.includes('npi')) {
                    if (objectPath.has(request_doc, 'vc')) {
                      for (const vc of request_doc.vc) {
                        if (objectPath.has(vc, 'vc.credentialSubject.npi')) {
                          check_privileges.push({location: a, privilege: 'npi'});
                          const privilege_arr = objectPath.get(resource_doc, 'privileges')
                          privilege_arr.push(request_doc.email)
                          objectPath.set(resource_doc, 'privileges', privilege_arr);
                          await gnap_resources.insert(resource_doc);
                        }
                      }
                    }
                  }
                }
                // check offline
                if (check_privileges.length === 0) {
                  if (resource_doc.privileges.includes('offline')) {
                    if (objectPath.has(request_doc, 'vc')) {
                      for (const vc1 of request_doc.vc) {
                        if (objectPath.has(vc1, 'vc.credentialSubject.firstName')) {
                          check_privileges.push({location: a, privilege: 'offline'});
                          const privilege_arr1 = objectPath.get(resource_doc, 'privileges')
                          privilege_arr1.push(request_doc.email)
                          objectPath.set(resource_doc, 'privileges', privilege_arr1);
                          await gnap_resources.insert(resource_doc);
                        }
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // no resource that matches
              res.status(200).json({ error: "no matching resource" });
            }
          }
        }
        if (check_privileges.length > 0 && action_flag.length === 0) {
          // approved
          objectPath.set(request_doc, 'state', 'approved');
          const hash = createHash('sha256');
          hash.update(request_doc.interact.finish.nonce + '\n');
          hash.update(request_doc.response.interact.finish + '\n');
          hash.update(request_doc.interact_nonce.value + '\n');
          hash.update(request_doc.initial_req_tx);
          const hash_result = hash.digest('base64url');
          objectPath.set(request_doc, 'interact_finish_hash', hash_result);
          objectPath.set(request_doc, 'approved_resources', pending_resources);
          await gnap.insert(request_doc);
          res.status(200).json({ success: request_doc });
        } else {
          // pending
          if (!init) {
            if (objectPath.has(request_doc, 'pending_resources')) {
              res.status(200).json({
                "continue": {
                  "access_token": {
                    "value": response.docs[0].access_token.value
                  },
                  "uri": url.protocol + "//" + url.hostname + "/api/as/continue",
                  "wait": 30
              }});
            } else {
              objectPath.set(request_doc, 'pending_resources', pending_resources);
              objectPath.set(request_doc, 'request_date', moment().format());
              await gnap.insert(request_doc);
              // send request to resource owner for approval
              const url_full = domain + "/review/" + response.docs[0].interact_nonce.value;
              const htmlContent = fs.readFileSync(path.join(process.cwd(), 'public', 'email.html'), 'utf-8');
              const htmlFinal = htmlContent.replace(/[\r\n]+/gm, '')
                .replace('@title', 'HIE of One - Resource Privilege Request')
                .replace('@previewtext', 'HIE of One - Resource Privilege Request')
                .replace('@paragraphtext', 'HIE of One Trustee Resource Privilege Request')
                .replace('@2paragraphtext', '')
                .replaceAll('@link', url_full)
                .replace('@buttonstyle', 'display:block')
                .replace('@buttontext', 'New Privileges Requested for your Resources');
              const sendmail = await fetch(domain + "/api/sendmail", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: objectPath.get(request_doc, 'pending_resources.0.ro'),
                  subject: "HIE of One - Resource Privilege Request",
                  html: htmlFinal
                })
              });
              const { error } = await sendmail.json();
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
            res.status(200).json({ error: "need to gather claims" })
          }
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
