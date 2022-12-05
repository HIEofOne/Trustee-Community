// pages/api/user.js

import Iron from '@hapi/iron';
import CookieService from '../../../lib/cookie';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

//@ts-ignore
const User = async (req, res) => {
  let user;
  try {
    user = await Iron.unseal(
      CookieService.getAuthToken(req.cookies),
      //@ts-ignore
      serverRuntimeConfig.ENCRYPTION_SECRET,
      Iron.defaults,
    );
  } catch (error) {
    res.status(401).end();
  }

  // now we have access to the data inside of user
  // and we could make database calls or just send back what we have
  // in the token.

  res.json(user);
};

export default User;
