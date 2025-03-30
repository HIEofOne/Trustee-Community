import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from '../../../lib/session';
import { NextApiRequest, NextApiResponse } from 'next';
import CookieService from '../../../lib/cookie';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );
  CookieService.removeCookies(response);
  session.destroy();
  response.setHeader("location", "/");
  response.statusCode = 302;
  response.end();
}