import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../../lib/cors';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: '*',
    optionsSuccessStatus: 200
  });
  res.status(200).json({
    "grant_request_endpoint": url.protocol + "//" + url.hostname + '/api/as/tx',
    "introspection_endpoint": url.protocol + "//" + url.hostname + '/api/as/introspect',
    "resource_registration_endpoint": url.protocol + "//" + url.hostname + '/api/as/resource',
    "token_formats_supported": ["jwt"]
  });
}

export default handler;
