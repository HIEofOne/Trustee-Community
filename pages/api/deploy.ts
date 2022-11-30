import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiRequest, NextApiResponse } from 'next'
import absoluteUrl from 'next-absolute-url'

import { exec } from 'child_process'
import * as envfile from 'envfile'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import writeYamlFile from 'write-yaml-file'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { protocol, host } = absoluteUrl(req)
  const id = uuidv4().replaceAll('-', '')
  const path = process.cwd() + '/trustees/' + id
  const url = id + '.' + host
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
    // write env file
    var env = {
      // "MOJOAUTH_API_KEY": process.env.MOJOAUTH_API_KEY,
      "MAGIC_API_KEY": process.env.MAGIC_API_KEY,
      // "MAILGUN_API_KEY": process.env.MAILGUN_API_KEY,
      // "MAILGUN_DOMAIN": process.env.MAILGUN_DOMAIN,
      "COUCHDB_URL": "http://127.0.0.1:5984",
      "COUCHDB_USER": "admin",
      "COUCHDB_PASSWORD": req.body.pin + '-' + req.body.dob,
      "COUCHDB_ENCRYPT_PIN": req.body.pin,
      "INSTANCE": "docker",
      "TRUSTEE_URL": protocol + '//' + host + '/trustee',
      "NOSH_DISPLAY": req.body.first_name + " " + req.body.last_name,
      "NOSH_EMAIL": req.body.email,
      "NOSH_DID": "",
      "NOSH_ROLE": "patient",
      "NOSH_FIRSTNAME": req.body.first_name,
      "NOSH_LASTNAME": req.body.last_name,
      "NOSH_BIRTHDAY": req.body.dob,
      "NOSH_GENDER": req.body.gender,
      "NOSH_BIRTHGENDER": req.body.birthgender,
      "AUTH": "magic",
      // # either [mojoauth, magic]
      "USPSTF_KEY": process.env.USPSTF_KEY,
      "UMLS_KEY": process.env.UMLS_KEY,
      "OIDC_RELAY_URL": process.env.OIDC_RELAY_URL
    }
    fs.writeFileSync(path + '/.env', envfile.stringify(env))
    // write docker-compose file
    var docker = {
      "version": "3.1",
      "services": {
        "couchdb": {
          "image": "couchdb:latest",
          "restart": "always",
          "env_file": [
            "./.env"
          ],
          "environment": {
            "COUCHDB_USER": "${COUCHDB_USER}",
            "COUCHDB_PASSWORD": "${COUCHDB_PASSWORD}"
          },
          "volumes": [
            "./dbdata:/opt/couchdb/data",
            "./dbconfig:/opt/couchdb/etc/local.d"
          ],
          "labels": [
            "traefik.enable=true",
            "traefik.docker.network=traefik_default",
            "traefik.http.services." + id + "-couchdb.loadbalancer.server.port=5984",
            "traefik.http.routers." + id + "-couchdb.entrypoints=http",
            "traefik.http.routers." + id + "-couchdb.rule=Host(`" + url + "`) && PathPrefix(`/couchdb`)",
            "traefik.http.middlewares." + id + "-https-redirect.redirectscheme.scheme=https",
            "traefik.http.routers." + id + "-couchdb.middlewares=" + id + "-https-redirect",
            "traefik.http.routers." + id + "-couchdb-secure.entrypoints=https",
            "traefik.http.routers." + id + "-couchdb-secure.rule=Host(`" + url + "`) && PathPrefix(`/couchdb`)",
            "traefik.http.routers." + id + "-couchdb-secure.tls=true",
            "traefik.http.routers." + id + "-couchdb-secure.tls.certresolver=http",
            "traefik.http.routers." + id + "-couchdb-secure.service=" + id + "-couchdb",
            "traefik.http.routers." + id + "-couchdb-secure.middlewares=" + id + "-couchdb-stripprefix",
            "traefik.http.middlewares." + id + "-couchdb-stripprefix.stripprefix.prefixes=/couchdb",
            "com.centurylinklabs.watchtower.enable=true"
          ]
        },
        "nosh": {
          "image": "shihjay2/nosh3",
          "restart": "always",
          "env_file": [
            "./.env"
          ],
          "labels": [
            "traefik.enable=true",
            "traefik.docker.network=traefik_default",
            "traefik.http.services." + id + "-nosh.loadbalancer.server.port=4000",
            "traefik.http.routers." + id + "-nosh.entrypoints=http",
            "traefik.http.routers." + id + "-nosh.rule=(Host(`" + url + "`) && PathPrefix(`/app`)) || (Host(`" + url + "`) && PathPrefix(`/fhir`)) || (Host(`" + url + "`) && PathPrefix(`/fetch`)) || (Host(`" + url + "`) && Path(`/oidc`)) || (Host(`" + url + "`) && PathPrefix(`/auth`)) || (Host(`" + url + "`) && Path(`/start`)) || (Host(`" + url + "`) && Path(`/help`))",
            "traefik.http.middlewares." + id + "-https-redirect.redirectscheme.scheme=https",
            "traefik.http.routers." + id + "-nosh.middlewares=" + id + "-https-redirect",
            "traefik.http.routers." + id + "-nosh-secure.entrypoints=https",
            "traefik.http.routers." + id + "-nosh-secure.rule=(Host(`" + url + "`) && PathPrefix(`/app`)) || (Host(`" + url + "`) && PathPrefix(`/fhir`)) || (Host(`" + url + "`) && PathPrefix(`/fetch`)) || (Host(`" + url + "`) && Path(`/oidc`)) || (Host(`" + url + "`) && PathPrefix(`/auth`)) || (Host(`" + url + "`) && Path(`/start`)) || (Host(`" + url + "`) && Path(`/help`))",
            "traefik.http.routers." + id + "-nosh-secure.tls=true",
            "traefik.http.routers." + id + "-nosh-secure.tls.certresolver=http",
            "traefik.http.routers." + id + "-nosh-secure.service=" + id + "-nosh",
            "com.centurylinklabs.watchtower.enable=true"
          ]
        }
      },
      "networks": {
        "traefik_default": {
          "external": true
        }
      }
    }
    const opts = {forceQuotes: true, quotingType: '"'}
    await writeYamlFile(path + '/docker-compose.yml', docker, opts)
    exec('cd ' + path + '; /usr/bin/docker compose up -d', (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
          console.log(`exec error: ${error}`);
      }
    })
    res.send({url: 'https://' + url + '/start'})
  }
}

export default withIronSessionApiRoute(handler, {
  cookieName: 'siwe',
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
})