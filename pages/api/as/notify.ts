import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import verifySig from '../../../lib/verifySig';
import verifyJWT from '../../../lib/verifyJWT';
import objectPath from 'object-path';
import fs from 'fs';
import path from 'path';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: '*',
    optionsSuccessStatus: 200
  });
  if (await verifySig(req)) {
    if (objectPath.has(req, 'body.to')) {
      let proceed = false;
      if (req.headers['authorization'] !== undefined) {
        const jwt = req.headers['authorization'].split(' ')[1];
        if (await verifyJWT(jwt, objectPath.get(req, 'body.from_email'))) {
          proceed = true;
        }
      }
      if (proceed) {
        const access = req.body.access.join(', ');
        console.log(access)
        const message = req.body.from + '(' + req.body.from_email + ') has invited you to <b>' + access + '</b> the folowing health record:';
        const htmlContent = fs.readFileSync(path.join(process.cwd(), 'public', 'email.html'), 'utf-8');
        const htmlFinal = htmlContent.replace(/[\r\n]+/gm, '')
          .replace('@title', 'HIE of One - Health Record Shared With You')
          .replace('@previewtext', 'HIE of One - Health Record Shared With You')
          .replace('@paragraphtext', `<h3>${req.body.from} shared a health record resource</h3>${message}`)
          .replace('@2paragraphtext', '')
          .replaceAll('@link', req.body.url)
          .replace('@buttonstyle', 'display:block')
          .replace('@buttontext', 'Link to their Personal Health Record');
        const sendmail = await fetch(domain + "/api/sendmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: req.body.to,
            subject: "HIE of One - Health Record Shared With You",
            html: htmlFinal,
          })
        });
        const { error } = await sendmail.json();
        if (error) { 
          console.log(error); 
        }
        res.status(200).json({success: true});
      } else {
        res.status(401).send('Unauthorized - verify JWT failed');
      }
    }
  } else {
    res.status(401).send('Unauthorized - verify signature failed');
  }
}

export default handler;
