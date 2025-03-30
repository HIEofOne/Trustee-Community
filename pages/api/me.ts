import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from '../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  const session = await getIronSession<SessionData>(
    req,
    res,
    sessionOptions,
  );
  switch (method) {
    case 'GET':
      res.send({ address: session.siwe?.address })
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default handler;