import { RP, CreateJwtCallback, VerifyJwtCallback, ResponseType, ResponseMode, Scope, PassBy, SupportedVersion, SubjectType } from '@sphereon/did-auth-siop';
import { agent } from './veramo';
import { getUniResolver } from '@sphereon/did-uni-client';
import { Resolvable, Resolver, ResolverRegistry } from 'did-resolver';
import { createJWT, JWTVerifyOptions, verifyJWT } from 'did-jwt';
import { JWTHeader } from 'did-jwt/lib/JWT';
import { VerifyCallback } from '@sphereon/wellknown-dids-client';
import { parseJWT, SigningAlgo } from '@sphereon/oid4vc-common';
import { VerifiedJWT } from '@sphereon/did-auth-siop';
import { bytesToBase64, createJWK } from '@veramo/utils';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const url_res = url.protocol + "//" + url.hostname + "/api/vp/response";
const url_auth = url.protocol + "//" + url.hostname + "/api/vp/authorize";
const identifier = await agent.didManagerGetOrCreate({ alias: 'default' });

const getAudience = (jwt: string) => {
  const { payload } = parseJWT(jwt)
  if (!payload) {
    throw new Error('No audience found in JWT payload or not configured')
  } else if (!payload.aud) {
    return undefined
  } else if (Array.isArray(payload.aud)) {
    throw new Error('Audience is invalid. Should be a string value.')
  }
  return payload.aud
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

const verifyJwtCallback = (
  resolver?: Resolvable,
  verifyOpts?: JWTVerifyOptions & {
    checkLinkedDomain: 'never' | 'if_present' | 'always'
    wellknownDIDVerifyCallback?: VerifyCallback
  },
): VerifyJwtCallback => {
  return async (jwtVerifier, jwt) => {
    resolver = resolver ?? getResolver(['ethr', 'ion'])
    const audience =
      jwtVerifier.type === 'request-object'
        ? (verifyOpts?.audience ?? getAudience(jwt.raw))
        : jwtVerifier.type === 'id-token'
          ? (verifyOpts?.audience ?? getAudience(jwt.raw))
          : undefined
    await verifyDidJWT(jwt.raw, resolver, { audience, ...verifyOpts })
    return true
  }
}

const createJwtCallback = (): CreateJwtCallback => {
  return async (jwtIssuer, jwt) => {
    if (jwtIssuer.method === 'did') {
      const jwk = createJWK("Ed25519", identifier.keys[0].publicKeyHex);
      jwt.header = {alg: 'EdDSA', typ: 'JWT', jwk: jwk };
      const signer = (data: string | Uint8Array ) => {
        let dataString, encoding: 'base64' | undefined
        if (typeof data === 'string') {
          dataString = data
          encoding = undefined
        } else {
          ;(dataString = bytesToBase64(data)), (encoding = 'base64')
        }
        return agent.keyManagerSign({ keyRef: identifier.keys[0].kid, data: dataString, alg: jwt.header.alg })
      }
      const jwt_created = await createJWT(
        jwt.payload,
        { issuer: identifier.did, signer, alg: jwt.header.alg },
        jwt.header as Partial<JWTHeader>
      );
      return jwt_created;
    }
    throw new Error('Not implemented yet')
  }
}

const verifyDidJWT = async(jwt: string, resolver: Resolvable, options: JWTVerifyOptions): Promise<VerifiedJWT> => {
  try {
    return await verifyJWT(jwt, { ...options, resolver })
  } catch (e: any) {
    return Promise.reject(e)
  }
}

const resolver = getResolver('ethr');

export const rp = RP.builder({ requestVersion: SupportedVersion.SIOPv2_ID1 })
  .withClientId(identifier.did)
  .withScope('openid')
  .withResponseType('id_token')
  .withResponseMode(ResponseMode.POST)
  .withAuthorizationEndpoint(url_auth)
  .withRedirectUri(url_res)
  .withVerifyJwtCallback(verifyJwtCallback(resolver))
  .withRequestBy(PassBy.VALUE)
  .withCreateJwtCallback(createJwtCallback())
  .withSupportedVersions(SupportedVersion.SIOPv2_ID1)
  .withClientMetadata({
    client_id: identifier.did,
    idTokenSigningAlgValuesSupported: [SigningAlgo.EDDSA, SigningAlgo.ES256],
    requestObjectSigningAlgValuesSupported: [SigningAlgo.EDDSA, SigningAlgo.ES256],
    responseTypesSupported: [ResponseType.ID_TOKEN],
    vpFormatsSupported: { 
      jwt_vc: { alg: [SigningAlgo.EDDSA, SigningAlgo.RS256, SigningAlgo.ES256] },
      jwt_vp: { alg: [SigningAlgo.EDDSA, SigningAlgo.RS256, SigningAlgo.ES256] } 
    },
    scopesSupported: [Scope.OPENID_DIDAUTHN, Scope.OPENID],
    subjectTypesSupported: [SubjectType.PAIRWISE],
    subject_syntax_types_supported: ['did', 'did:ethr', 'did:key', 'did:jwk', 'did:web', 'did:ion'],
    passBy: PassBy.VALUE,
    // logo_uri: VERIFIER_LOGO_FOR_CLIENT,
    clientName: 'Trustee',
    clientPurpose: "Grant Negotiation and Authorization Protocol (GNAP) Server"
  })
  .build();