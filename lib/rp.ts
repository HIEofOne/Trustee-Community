import { agent } from './veramo';
import { getUniResolver } from '@sphereon/did-uni-client';
import { Resolvable, Resolver, ResolverRegistry } from 'did-resolver';
import { createJWT, decodeJWT, verifyJWT } from 'did-jwt';
import { JWTHeader } from 'did-jwt/lib/JWT';
import { bytesToBase64, createJWK } from '@veramo/utils';
import moment from 'moment';
import objectPath from 'object-path';
import { get } from 'http';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const url_res = url.protocol + "//" + url.hostname + "/api/vp/response";

const createAuthRequest = async(nonce:string, state:string, type:string, pd_id:string) => {
  const identifier = await agent.didManagerGetOrCreate({ alias: 'default' });
  const iat = moment().unix();
  let constraints = {}
  if (type === 'NPI') {
    constraints = {
      "fields": [
        {
          "path": [
            "$.vc.credentialSubject.npi",
            "$.vc.credentialSubject.name",
            "$.vc.credentialSubject.description",
            "$.vc.credentialSubject.gender",
            "$.vc.credentialSubject.city",
            "$.vc.credentialSubject.state",
            "$.vc.credentialSubject.zip",
            "$.vc.credentialSubject.credentials",
            "$.vc.credentialSubject.specialty",
            "$.vc.credentialSubject.medicalSchools",
            "$.vc.credentialSubject.residencies",
            "$.vc.credentialSubject.profilePhoto",
          ]
        }
      ]
    } 
  } else {
    constraints = {
      "fields": [
        {
          "path": [
            "$.vc.credentialSubject.email"
          ]
        }
      ]
    }
  }
  const payload = {
    "iat": iat,
    "exp": iat + 120,
    "response_type": "vp_token id_token",
    "scope": "openid",
    "client_id": identifier.did,
    "redirect_uri": url_res,
    "response_mode": "post",
    "nonce": nonce,
    "state": state,
    "client_metadata": {
      "id_token_signing_alg_values_supported": [
        "EdDSA",
        "ES256"
      ],
      "request_object_signing_alg_values_supported": [
        "EdDSA",
        "ES256"
      ],
      "response_types_supported": [
        "id_token",
        "vp_token"
      ],
      "scopes_supported": [
        "openid did_authn",
        "openid"
      ],
      "subject_types_supported": [
        "pairwise"
      ],
      "subject_syntax_types_supported": [
        "did",
        "did:ethr",
        "did:key",
        "did:jwk",
        "did:web",
        "did:ion"
      ],
      "vp_formats": {
        "jwt_vc": {
          "alg": [
            "EdDSA",
            "RS256",
            "ES256"
          ]
        },
        "jwt_vp": {
          "alg": [
            "EdDSA",
            "RS256",
            "ES256"
          ]
        }
      },
      "client_name": "Trustee",
      "client_purpose": "Grant Negotiation and Authorization Protocol (GNAP) Server",
      "client_id": identifier.did
    },
    "presentation_definition": {
      "id": pd_id,
      "input_descriptors": [
        {
          "id": "1",
          "name": type + " Verifiable Credential",
          "purpose": "We want a VC of this type to proof claim",
          "constraints": constraints,
          "schema": [
            {
              "uri": "https://www.w3.org/2018/credentials/v1"
            }
          ]
        }
      ]
    }
  };
  const jwk = createJWK("Ed25519", identifier.keys[0].publicKeyHex);
  const header = {alg: 'EdDSA', typ: 'JWT', jwk: jwk };
  const signer = (data: string | Uint8Array ) => {
    let dataString, encoding: 'base64' | undefined
    if (typeof data === 'string') {
      dataString = data
      encoding = undefined
    } else {
      ;(dataString = bytesToBase64(data)), (encoding = 'base64')
    }
    return agent.keyManagerSign({ keyRef: identifier.keys[0].kid, data: dataString, alg: header.alg })
  }
  const jwt_created = await createJWT(
    payload,
    { issuer: identifier.did, signer, alg: header.alg },
    header as Partial<JWTHeader>
  );
  return jwt_created;
}

const verifyAuthResponse = async(jwt:string) => {
  let decoded = decodeJWT(jwt);
  let resolver = null;
  if (objectPath.has(decoded, 'payload.cnf')) {
    resolver = getResolver(decoded.payload.cnf.kid)
  } else {
    resolver = getResolver(decoded.header.kid);
  }
  try {
    return await verifyJWT(jwt, { resolver, audience: "null" })
  } catch (e: any) {
    return Promise.reject(e)
  }
}

const getResolver = (methods: string | string[]): Resolvable => {
  const getMethodFromDid = (did: string): string => {
    if (!did) {
      throw new Error('Wrong parameters provided.');
    }
    const split = did.split(':');
    if (split.length == 1 && did.length > 0) {
      return did;
    } else if (!did.startsWith('did:') || split.length < 2) {
      throw new Error('Wrong parameters provided.');
    }
    return split[1];
  }
  const uniResolvers: ResolverRegistry[] = [];
  for (const didMethod of typeof methods === 'string' ? [methods] : methods) {
    const uniResolver = getUniResolver(getMethodFromDid(didMethod));
    uniResolvers.push(uniResolver);
  }
  return new Resolver(...uniResolvers);
}

export { createAuthRequest, verifyAuthResponse }