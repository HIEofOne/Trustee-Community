import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import type { VerifiedAuthenticationResponse, VerifiedRegistrationResponse } from '@simplewebauthn/server';
import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
// import type { PublicKeyCredentialWithAssertionJSON, PublicKeyCredentialWithAttestationJSON } from '@github/webauthn-json';
import crypto from 'crypto';
import * as jose from 'jose';
import objectPath from 'object-path';

type SessionRequest = NextApiRequest | GetServerSidePropsContext["req"];

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

const HOST_SETTINGS = {
  expectedOrigin: process.env.DOMAIN ?? "http://localhost:3000",
  expectedRPID: url.hostname,
};
function binaryToBase64url(bytes: Uint8Array) {
  let str = "";
  bytes.forEach((charCode) => {
    str += String.fromCharCode(charCode);
  });
  return btoa(str);
}
function clean(str: string) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
export function generateChallenge() {
  return clean(crypto.randomBytes(32).toString("base64"));
}
export function isLoggedIn(req: SessionRequest) {
  return req.session.userId != null;
}
export async function register(req: NextApiRequest) {
  const challenge = req.session.challenge ?? "";
  const credential = req.body.credential as any;
  const { email } = req.body;
  let verification: VerifiedRegistrationResponse;
  if (credential == null) {
    throw new Error("Invalid Credentials");
  }
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      requireUserVerification: true,
      ...HOST_SETTINGS,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
  if (!verification.verified) {
    throw new Error("Registration verification failed");
  }
  const { credentialID, credentialPublicKey } =
    verification.registrationInfo ?? {};
  if (credentialID == null || credentialPublicKey == null) {
    throw new Error("Registration failed");
  }
  const patients = await nano.db.use("patients");
  const user = await patients.get(email);
  const credentials = {
    create: {
      externalId: clean(binaryToBase64url(credentialID)),
      publicKey: Buffer.from(credentialPublicKey),
      signCount: 0
    },
  };
  objectPath.set(user, 'credentials', credentials);
  await patients.insert(user);
  console.log(`Registered new user ${req.body.email}`);
  return user;
}
export async function login(req: NextApiRequest) {
  const challenge = req.session.challenge ?? "";
  const credential = req.body.credential;
  const email = req.body.email;
  if (credential?.id == null) {
    throw new Error("Invalid Credentials");
  }
  const patients = await nano.db.use("patients");
  const results = await patients.find({
    selector: {'credentials.create.externalId': {$eq: credential.id}, _id: {"$gte": null}}
  });
  const userCredential = results.docs[0]
  if (results.docs.length === 0) {
    throw new Error("Unknown User or Invalid Passkey");
  }
  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential as any,
      expectedChallenge: challenge,
      authenticator: {
        credentialID: userCredential.credentials.create.externalId,
        credentialPublicKey: Buffer.from(userCredential.credentials.create.publicKey.data),
        counter: userCredential.credentials.create.signCount,
      },
      ...HOST_SETTINGS,
    });
    objectPath.set(userCredential, 'credentials.create.signCount', verification.authenticationInfo.newCounter)
    await patients.insert(userCredential)
  } catch (error) {
    console.error(error);
    throw error;
  }
  if (!verification.verified || email !== userCredential._id) {
    throw new Error("Login verification failed");
  }
  console.log(`Logged in as user ${userCredential._id}`);
  const keys = await nano.db.use("keys");
  const keyList = await keys.list();
  const key = await keys.get(keyList.rows[0].id);
  const rsaPrivateKey = await jose.importJWK(key.privateKey, 'RS256');
  const header = { alg: key.privateKey.alg, kid: key.privateKey.kid, typ: 'JWT' };
  const payload = {
    "response_type": "id_token",
  }
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt()
    .setIssuer(domain)
    .setAudience(domain)
    .setExpirationTime('2h')
    .setSubject(userCredential._id)
    .sign(rsaPrivateKey);
  return {userId: userCredential._id, jwt: jwt};
}