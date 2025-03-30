import { SessionOptions } from "iron-session";
import { SiweMessage } from 'siwe';

export interface SessionData {
  userId: string;
  isLoggedIn: boolean;
  nonce?: string;
  challenge: string;
  token?: string;
  jwt?: string;
  siwe?: SiweMessage;
}

export const defaultSession: SessionData = {
  userId: "",
  challenge: "",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  // password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: "next-webauthn",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

// export function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }