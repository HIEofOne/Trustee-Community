import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';
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
  // const body = {
  //   to: 'email@address.com',
  //   from: '',
  //   from_email: 'email@address.com',
  //   subject: '',
  //   title: '',
  //   previewtext: '',
  //   paragraphtext: '' (btoa('')),
  //   paragraphtext2: '' (btoa('')),
  //   link: 'https://example.com',
  //   buttonstyle: 'display:block' || 'display:none',
  //   buttontext: ''
  // }
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
        const htmlContent = fs.readFileSync(path.join(process.cwd(), 'public', 'email.html'), 'utf-8');
        const htmlFinal = htmlContent.replace(/[\r\n]+/gm, '')
          .replace('@title', req.body.title)
          .replace('@previewtext', req.body.previewtext)
          .replace('@paragraphtext', atob(req.body.paragraphtext))
          .replace('@2paragraphtext', atob(req.body.paragraphtext2))
          .replaceAll('@link', req.body.link)
          .replace('@buttonstyle', req.body.buttonstyle)
          .replace('@buttontext', req.body.buttontext);
        console.log(htmlFinal)
        console.log(req.body.to)
        console.log(req.body.subject)
        const sendmail = await fetch(domain + "/api/sendmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: req.body.to,
            subject: req.body.subject,
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
