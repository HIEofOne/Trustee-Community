import * as jose from "jose";
import { randomBytes } from "crypto";
import objectPath from "object-path";

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function verifyJWT(jwt: any, ro: any) {
  const keys = await nano.db.use("keys");
  const keyList = await keys.list();
  const key = await keys.get(keyList.rows[0].id);
  const jwk = await jose.importJWK(key.privateKey, 'RS256');
  try {
    const { payload } = await jose.jwtVerify(jwt, jwk);
    if (objectPath.get(payload, 'sub') === ro) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
export default verifyJWT;