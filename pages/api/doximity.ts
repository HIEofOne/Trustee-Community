
import { NextApiRequest, NextApiResponse } from 'next'
import NextCors from "nextjs-cors";
import { Issuer, generators } from 'openid-client';
import crypto from 'crypto';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const doximityIssuer  = await Issuer.discover('https://auth.doximity.com/.well-known/oauth-authorization-server');
  const doximityClient = new doximityIssuer.Client({
    client_id: <string>process.env.DOXIMITY_CLIENT_ID,
    client_secret: <string>process.env.DOXIMITY_CLIENT_SECRET,
    redirect_uris: ['https://dir.hieofone.org/doximity_redirect'],
    // redirect_uris: [process.env.DOMAIN + '/doximity_redirect'],
    response_types: ['code']
  });
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  const nonce = crypto.randomBytes(16).toString('base64url');
  const doximityRedirect = doximityClient.authorizationUrl({
    scope: 'openid',
    code_challenge,
    state: '12345',
    code_challenge_method: 'S256',
  });
  res.status(200).json({redirect: doximityRedirect})
}
export default handler;