import type { IronSessionOptions } from 'iron-session';

export const sessionOptions: IronSessionOptions = {
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  // password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: "next-webauthn",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};
