import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from '../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next'
import { SiweMessage } from 'siwe'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  const session = await getIronSession<SessionData>(
    req,
    res,
    sessionOptions,
  );
  switch (method) {
    case 'POST':
      try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);
        const fields = await siweMessage.validate(signature);
        if (fields.nonce !== session.nonce) {
          return res.status(422).json({ message: 'Invalid nonce.' });
        }
        session.siwe = fields;
        await session.save();
        res.json({ ok: true });
      } catch (_error) {
        res.json({ ok: false });
      }
      break
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default handler;