import { createAgent } from '@veramo/core'
import { DIDManager } from '@veramo/did-manager'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'
import { DataStoreJson, KeyStoreJson, DIDStoreJson, PrivateKeyStoreJson } from '@veramo/data-store-json'
import fs from 'fs'
import { JsonFileStore } from './store'
import {
  IDIDManager,
  IKeyManager,
  IResolver,
  IDataStore,
  ICredentialIssuer,
  TAgent
} from '@veramo/core-types'
type ConfiguredAgent = TAgent<IDIDManager & IKeyManager & IResolver & IDataStore & ICredentialIssuer>

const INFURA_PROJECT_ID = process.env.INFURIA_API_KEY
// const INFURA_PROJECT_ID = '62cfe5babc774c1aaffa9eac6dbbf47f'
let KMS_SECRET_KEY = null
const kmsfile = '/data/kms';
const storefile = '/data/store.json';

if (fs.existsSync(kmsfile)) {
  KMS_SECRET_KEY = fs.readFileSync(kmsfile, 'utf8')
} else {
  KMS_SECRET_KEY = await SecretBox.createSecretKey()
  fs.writeFileSync(kmsfile, KMS_SECRET_KEY)
}

const jsonFileStore = await JsonFileStore.fromFile(storefile)

export const agent: ConfiguredAgent = createAgent({
  plugins: [
    new KeyManager({
      store: new KeyStoreJson(jsonFileStore),
      kms: {
        local: new KeyManagementSystem(new PrivateKeyStoreJson(jsonFileStore, new SecretBox(KMS_SECRET_KEY))),
      }
    }),
    new DIDManager({
      store: new DIDStoreJson(jsonFileStore),
      defaultProvider: 'did:key',
      providers: {
        'did:ethr:sepolia': new EthrDIDProvider({
          defaultKms: 'local',
          network: 'sepolia',
          rpcUrl: 'https://sepolia.infura.io/v3/' + INFURA_PROJECT_ID,
        }),
        'did:key': new KeyDIDProvider({
          defaultKms: 'local'
        })
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
        ...webDidResolver(),
      })
    }),
    new DataStoreJson(jsonFileStore),
    new CredentialPlugin()
  ],
})
  