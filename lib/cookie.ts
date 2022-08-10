
import { serialize } from 'cookie';

const TOKEN_NAME = 'api_token';
const MAX_AGE = 60 * 60 * 8;

//@ts-ignore
function createCookie(name, data, options = {}) {
  return serialize(name, data, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    ...options,
  });
}
//@ts-ignore
function removeCookie(name, data, options = {}) {
    return serialize(name, data, {
      expires: new Date(Date.now() - 86400000),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      ...options,
    });
  }
  
//@ts-ignore
function setTokenCookie(res, token) {
  res.setHeader('Set-Cookie', [
    createCookie(TOKEN_NAME, token),
    createCookie('authed', true, { httpOnly: false }),
  ]);
}
//@ts-ignore
function removeCookies(res) {
    res.setHeader('Set-Cookie', [
        removeCookie(TOKEN_NAME, "removed"),
        removeCookie('authed', false, { httpOnly: false }),
    ])
}
//@ts-ignore
function getAuthToken(cookies) {
  return cookies[TOKEN_NAME];
}

export default { setTokenCookie, getAuthToken, removeCookies };
