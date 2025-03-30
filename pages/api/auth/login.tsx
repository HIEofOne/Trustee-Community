import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from '../../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next';
import { login } from '../../../lib/auth';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    const {userId, jwt} = await login(request, response);
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions,
    );
    session.userId = userId;
    session.jwt = jwt;
    session.isLoggedIn = true;
    await session.save();
    response.json(userId);
  } catch (error) {
    response.status(500).json({ message: (error as Error).message });
  }
}