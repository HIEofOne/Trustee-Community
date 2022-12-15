
import { Magic } from '@magic-sdk/admin';
import Iron from '@hapi/iron';
import CookieService from '../../../lib/cookie';

//Tutorial: https://vercel.com/guides/add-auth-to-nextjs-with-magic
//@ts-ignore
const Login = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // exchange the did from Magic for some user data
  const did = req.headers.authorization.split('Bearer').pop().trim();
  const user = await new Magic(
    process.env.MAGIC_SECRET_KEY,
  ).users.getMetadataByToken(did);

  // Author a couple of cookies to persist a user's session
  const token = await Iron.seal(
    user,
    //@ts-ignore
    process.env.ENCRYPTION_SECRET,
    Iron.defaults,
  );
  CookieService.setTokenCookie(res, token);

  res.end();
};

export default Login;
