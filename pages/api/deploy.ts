import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import absoluteUrl from 'next-absolute-url';
import { DigitalOcean } from 'digitalocean-js';
import * as envfile from 'envfile';
import * as fs from 'fs';
import isReachable from 'is-reachable'
import { v4 as uuidv4 } from 'uuid';
import writeYamlFile from 'write-yaml-file';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const do_token: string = process.env.DIGITALOCEAN_API_TOKEN !== undefined ? process.env.DIGITALOCEAN_API_TOKEN: '';
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
const nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
const droplets = nano.db.use("droplets");
const patients = nano.db.use("patients");
const do_client = new DigitalOcean(do_token);
const pipePath = process.cwd() + "/hostpipe";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { protocol, host } = absoluteUrl(req);
  const id = uuidv4().replaceAll('-', '');
  const path = process.cwd() + '/trustees/' + id;
  const host_path = '/root/Trustee-Community/docker/trusteecommunity/trustees/' + id;
  const route_path = process.cwd() + '/routes/' + id + '.yml';
  const url = id + '.' + host;
  const url_full = 'http://' + url + '/start';
  const do_request = {
    name: 'Trustee Droplet 0',
    region: 'nyc3',
    size: 's-1vcpu-1gb',
    image: 'docker-20-04',
    ssh_keys: [process.env.DIGITALOCEAN_SSH_KEY_ID],
    backups: false,
    ipv6: true,
    tags: [
      'trustee'
    ]
  };
  var port = "900";
  var ip = '';
  var doc_id = '';
  // check for open droplets
  const dropletsList = await droplets.list({include_docs: true});
  if (dropletsList.total_rows > 0) {
    const openDroplet = dropletsList.rows.find((a: { doc: { full: string; }; }) => a.doc.full == "false");
    if (openDroplet !== undefined) {
      port += openDroplet.doc.ports.length;
      ip = openDroplet.doc.ip;
      doc_id = openDroplet.doc._id
    } else {
      // create droplet
      doc_id = uuidv4();
      do_request.name = doc_id;
      const droplet = await do_client.droplets.createNewDroplet(do_request);
      const doc = {
        _id: doc_id,
        ip: droplet.networks?.v4[0].ip_address,
        ports: [],
        full: 'false'
      };
      await droplets.insert(doc);
      port = '9000';
      ip = droplet.networks?.v4[0].ip_address!;
      const droplet_create_command = 'docker context create ' + doc_id + ' --docker "host=ssh://root@' + ip + '"';
      const droplet_create_stream = fs.createWriteStream(pipePath);
      droplet_create_stream.write(droplet_create_command);
      droplet_create_stream.close();
    }
  } else {
    // create droplet
    doc_id = uuidv4();
    do_request.name = doc_id;
    const droplet = await do_client.droplets.createNewDroplet(do_request);
    const doc = {
      _id: doc_id,
      ip: droplet.networks?.v4[0].ip_address,
      ports: [],
      full: 'false'
    };
    await droplets.insert(doc);
    port = '9000';
    ip = droplet.networks?.v4[0].ip_address!;
    const droplet_create_command = 'docker context create ' + doc_id + ' --docker "host=ssh://root@' + ip + '"';
    const droplet_create_stream = fs.createWriteStream(pipePath);
    droplet_create_stream.write(droplet_create_command);
    droplet_create_stream.close();
  }
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
    // write env file
    var env = {
      "MAGIC_API_KEY": process.env.MAGIC_API_KEY,
      // "MAILGUN_API_KEY": process.env.MAILGUN_API_KEY,
      // "MAILGUN_DOMAIN": process.env.MAILGUN_DOMAIN,
      "COUCHDB_URL": "http://couchdb:5984",
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
      "NOSH_BIRTHGENDER": req.body.birthGender,
      "AUTH": "magic",
      "USPSTF_KEY": process.env.USPSTF_KEY,
      "UMLS_KEY": process.env.UMLS_KEY,
      "OIDC_RELAY_URL": process.env.OIDC_RELAY_URL
    }
    fs.writeFileSync(path + '/.env', envfile.stringify(env))
    // write docker-compose file
    var docker = {
      "version": "3.7",
      "services": {
        "router": {
          "image": "traefik:latest",
          "ports": [
            port + ":80",
          ],
          "restart": "always",
          "depends_on": [
            "watchtower"
          ],
          "volumes": [
            "/var/run/docker.sock:/var/run/docker.sock:ro"
          ],
          "command": [
            "--api.insecure=true",
            "--providers.docker=true",
            "--providers.docker.exposedbydefault=false",
            "--providers.docker.constraints=Label(`nosh.zone`, `zone_" + id + "`)",
            "--entrypoints.web.address=:80",
            "--entrypoints.web.forwardedHeaders.insecure=true"
          ],
          "labels": [
            "com.centurylinklabs.watchtower.scope=" + id
          ]
        },
        "couchdb": {
          "image": "couchdb:latest",
          "restart": "always",
          "depends_on": [
            "router",
            "watchtower"
          ],
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
            "nosh.zone=zone_" + id,
            "traefik.enable=true",
            "traefik.http.routers.couchdb.rule=PathPrefix(`/couchdb`)",
            "traefik.http.routers.couchdb.middlewares=couchdb-stripprefix",
            "traefik.http.middlewares.couchdb-stripprefix.stripprefix.prefixes=/couchdb",
            "traefik.http.services.couchdb.loadbalancer.server.port=5984",
            "com.centurylinklabs.watchtower.scope=" + id
          ]
        },
        "nosh": {
          "image": "shihjay2/nosh3",
          "links": [
            "couchdb"
          ],
          "depends_on": [
            "router",
            "couchdb",
            "watchtower"
          ],
          "init": true,
          "restart": "always",
          "env_file": [
            "./.env"
          ],
          "labels": [
            "nosh.zone=zone_" + id,
            "traefik.enable=true",
            "traefik.http.routers.nosh.rule=PathPrefix(`/app`) || PathPrefix(`/fhir`) || PathPrefix(`/fetch`) || Path(`/oidc`) || PathPrefix(`/auth`) || Path(`/start`) || Path(`/ready`)",
            "traefik.http.services.nosh.loadbalancer.server.port=4000",
            "com.centurylinklabs.watchtower.scope=" + id
          ]
        },
        "watchtower": {
          "image": "containrrr/watchtower",
          "volumes": [
            "/var/run/docker.sock:/var/run/docker.sock"
          ],
          "command": "--interval 30 --scope " + id,
          "labels": [
            "traefik.enable=false"
          ]
        }
      }
    }
    var id_secure = id + "-secure"
    var id_redirect = id + "-https-redirect"
    var route = {
      "http": {
        "routers": {
          [id]: {
            "rule": "Host(`" + url + "`)",
            "service": id,
            "middlewares": [
              id_redirect
            ]
          },
         [id_secure]: {
            "rule": "Host(`" + url + "`)",
            "service": id,
            "tls": {
              "certResolver": "http"
            }
          }
        },
        "services": {
          [id]: {
            "loadBalancer": {
              "servers": [
                {
                  "url": "http://" + ip + ":" + port
                }
              ]
            }
          }
        },
        "middlewares": {
          [id_redirect]: {
            "redirectScheme": {
              "scheme": "https"
            }
          }
        }
      }
    }
    const opts = {forceQuotes: true, quotingType: '"'}
    await writeYamlFile(path + '/docker-compose.yml', docker, opts)
    await writeYamlFile(route_path, route, opts)
    const docker_up_command = "cd " + host_path + ";docker context use " + doc_id + ";docker compose up -d;docker context use default"
    const docker_up_stream = fs.createWriteStream(pipePath);
    docker_up_stream.write(docker_up_command);
    docker_up_stream.close();
    const doc_new = await droplets.get(doc_id);
    doc_new.ports.push(port);
    if (port == '9009') {
      doc_new.full = 'true';
    }
    await droplets.insert(doc_new);
    var doc_patient = await patients.get(req.body.email);
    doc_patient.phr = url;
    await patients.insert(doc_patient);
    var b = false;
    var c = 0;
    while (!b && c < 400) {
      b = await isReachable('https://' + url + '/ready');
      if (b || c == 399) {
        break;
      } else {
        c++;
        console.log(c);
      }
    }
    if (b) {
      const sendgrid = await fetch(domain + "/api/sendgrid", {
        body: JSON.stringify({
          email: req.body.email,
          subject: "HIE of One - Personal Health Record Confirmation",
          html: `<div><h1>Your HIE of One Trustee Personal Health Record (NOSH) has been created!</h1><h1><a href=${url_full}>Your Personal Health Record</a></h1></div>`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const { error } = await sendgrid.json();
      if (error) {
        console.log(error);
        res.status(500).send(error.message);
      } else {
        res.send({url: 'https://' + url + '/start', error: ''});
      }
    } else {
      console.log('error failure deploying NOSH');
      res.send({url: '', error: 'Failure in deploying NOSH.  Please try again.'});
    }
  }
}

export default withIronSessionApiRoute(handler, {
  cookieName: 'siwe',
  password: `yGB%@)'8FPudp5";E{s5;fq>c7:evVeU`,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
})