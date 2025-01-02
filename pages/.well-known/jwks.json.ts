import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../lib/cors';
import { agent } from '../../lib/veramo';
import { createJWK } from '@veramo/utils'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: '*',
    optionsSuccessStatus: 200
  });
  const keys: {JsonWebKey: JsonWebKey}[] = []
  const identifier = await agent.didManagerGetOrCreate({ alias: 'default' });
  for (const key of identifier.keys) {
    const jwk: JsonWebKey | any = createJWK("Ed25519", key.publicKeyHex);
    keys.push(jwk)
  }
  res.status(200).json({"keys": keys});
}

export default handler;