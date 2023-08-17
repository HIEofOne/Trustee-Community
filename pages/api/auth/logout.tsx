import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../../lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import CookieService from "../../../lib/cookie";

function handler(request: NextApiRequest, response: NextApiResponse) {
  CookieService.removeCookies(response);
  request.session.destroy();
  response.setHeader("location", "/");
  response.statusCode = 302;
  response.end();
}

export default withIronSessionApiRoute(handler, sessionOptions);