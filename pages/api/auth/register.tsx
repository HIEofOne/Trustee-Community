import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from '../../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next';
import { register } from '../../../lib/auth';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions,
    );
    const user = await register(request, response);
    session.userId = user.id;
    await session.save();
    response.json({ userId: user.id });
  } catch (error: unknown) {
    console.error((error as Error).message);
    response.status(500).json({ message: (error as Error).message });
  }
}