import Iron from '@hapi/iron';
import CookieService from '../../../lib/cookie';

const User = async (req: any, res: any) => {
  let user;
  try {
    user = await Iron.unseal(
      CookieService.getAuthToken(req.cookies),
      process.env.ENCRYPTION_SECRET as any,
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
