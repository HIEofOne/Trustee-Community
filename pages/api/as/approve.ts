import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import verifySig from '../../../lib/verifySig';
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
  if (await verifySig(req)) {
    const gnap_resources = await nano.db.use("gnap_resources");
    const gnap = await nano.db.use("gnap");
    try {
      const doc = await gnap_resources.get(req.body.id);
      const privileges = doc.privileges;
      privileges.push(req.body.privilege);
      objectPath.set(doc, 'privileges', privileges);
      await gnap_resources.insert(doc);
      const gnap_doc = await gnap.get(req.body.doc_id);
      const pending_resources = objectPath.get(gnap_doc, 'pending_resources');
      const pending_resource = objectPath.get(pending_resources, req.body.pending_resource_index);
      let message = '<h3>Type: ' + pending_resource.type +'</h3><ul>';
      console.log(message)
      for (const a of pending_resource.locations) {
        console.log(a)
        message += '<li>' + a + '</li>';
      }
      message += '</ul>';
      pending_resources.splice(req.body.pending_resource_index, 1);
      objectPath.set(gnap_doc, 'pending_resources', pending_resources);
      await gnap.insert(gnap_doc);
      const sendmail = await fetch(domain + "/api/sendmail", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: req.body.privilege,
            subject: "HIE of One - Resource Privilege Approved",
            html: `<div><h1>HIE of One Trustee Resource Privilege Request Approved</h1>${message}</div>`,
          })
        });
      const { error } = await sendmail.json();
      if (error) { 
        console.log(error); 
      }
      res.status(200).json({success: true});
    } catch (e) {
      res.status(401).send('No resource exists');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
}

export default handler;
