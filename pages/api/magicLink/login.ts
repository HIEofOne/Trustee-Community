import { Magic } from '@magic-sdk/admin';
import Iron from '@hapi/iron';
import CookieService from '../../../lib/cookie';

//Tutorial: https://vercel.com/guides/add-auth-to-nextjs-with-magic
const Login = async (req: any, res: any) => {
  if (req.method !== 'POST') return res.status(405).end();

  // exchange the did from Magic for some user data
  const did = req.headers.authorization.split('Bearer').pop().trim();
  const user = await new Magic(
    process.env.MAGIC_SECRET_KEY,
  ).users.getMetadataByToken(did);

  // Author a couple of cookies to persist a user's session
  const token = await Iron.seal(
    user,
    process.env.ENCRYPTION_SECRET as any,
    Iron.defaults,
  );
  CookieService.setTokenCookie(res, token);

  res.end();
};

export default Login;
