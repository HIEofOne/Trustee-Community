import CookieService from "../../../lib/cookie";

//@ts-ignore
export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  //Removes cookies but does not logout user from magic link
  //Users session will expire with time
  CookieService.removeCookies(res);
  res.end();
};
