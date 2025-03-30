import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from '../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next'
import { generateNonce } from 'siwe'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  const session = await getIronSession<SessionData>(
    req,
    res,
    sessionOptions,
  );
  switch (method) {
    case 'GET':
      session.nonce = generateNonce()
      await session.save()
      res.setHeader('Content-Type', 'text/plain')
      res.send(session.nonce)
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default handler;