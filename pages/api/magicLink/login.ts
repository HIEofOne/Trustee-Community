import Iron from '@hapi/iron';
import CookieService from '../../../lib/cookie';

const Login = async (req: any, res: any) => {
  if (req.method !== 'POST') return res.status(405).end();
  // Author a couple of cookies to persist a user's session
  const token = await Iron.seal(
    req.body,
    process.env.ENCRYPTION_SECRET as any,
    Iron.defaults,
  );
  CookieService.setTokenCookie(res, token);
  res.end();
};

export default Login;
