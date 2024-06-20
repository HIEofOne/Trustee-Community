# Trustee Community

#### Check out the wiki for sequence diagram and more https://github.com/HIEofOne/Trustee-Community/wiki 

Trustee Community is the code repository a community manager can fork to create a new patient community.

To create a new patient community, a manger will need these prequisites:
- An account at DigtialOcean to pay for hosting the community members Trustees (patient-controlled health records),
- An account at Stripe to collect credit card payments for Trustee subscriptions hosted by the community (optional)
- A domain name for the community,
- A privacy policy describing the initial configuration of Trustee access policies and how subscribers can change the policies if they choose.

## Installation
#### 1. Gather all API keys for Magic, USPSTF, UMLS, DigitalOcean, and SendGrid
- have these ready for the installer in step 5
- details on getting API keys are in the section [More on Additional API Services](#more-on-additional-api-services)
- assume you have a domain name (mydomain.xyz) and email address needed for LetsEncrypt SSL (my@email.xyz)
- you have a GitHub account to fork NOSH3 to.  You will need the organization name and [obtain a personal access token.](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
#### 2. Create a DigitalOcean Droplet with the minimum parameters:
- size: 's-1vcpu-1gb',
- image: 'ubuntu-22-10-x64'
#### 3. Ensure your domain name is associated with the IP of your DigitalOcean Droplet
#### 4. Login to the console (should be root user) and enter this command:
```
git clone -b deploy --single-branch https://github.com/HIEofOne/Trustee-Community.git
cd Trustee-Community
./do-install.sh
```
#### 5. The first pass will install all dependencies.  Logout and login to the droplet.
```
exit
cd Trustee-Community
./do-install.sh
```
#### 6. Open your browser to https://mydomain.xyz
- Other notable endpoints with your Trustee include:
- https://db.mydomain.xyz which points to the [CouchDB](https://couchdb.apache.org/) database used to store user account information (just email) and droplet info.
- https://router.mydomain.xyz which points to the [Traefik](https://doc.traefik.io/traefik/providers/docker/) reverse proxy router

## More on Additional API Services
### [Magic](https://magic.link/) instructions:
#### 1. Set up an account for free by visiting [Magic](https://magic.link).  Click on Start now.
#### 2. Once you are in the [dashboard](https://dashboard.magic.link/app/all_apps), go to Magic Auth and click on New App.  Enter the App Name (My App Powered by Trustee) and hit Create App.
#### 3. Once you are in the home page for the app, scroll down to API Keys and copy the PUBISHABLE API KEY value.  This API Key will be usee to interact with Magic's APIs
### [National Library of Medicine UMLS Terminology Services](https://uts.nlm.nih.gov/uts/) - this is to allow search queries for SNOMED CT LOINC, and RXNorm definitions.
#### 1. Set up an account [here](https://uts.nlm.nih.gov/uts/signup-login)
#### 2. [Edit your profile](https://uts.nlm.nih.gov/uts/edit-profile) and click on Generate new API Key.  Copy this API key.
### [US Preventive Services Task Force](https://www.uspreventiveservicestaskforce.org/apps/api.jsp) - this provides Care Opportunties guidance based on USPSTF guidelines
#### 1. [Visit this site for instructions](https://www.uspreventiveservicestaskforce.org/apps/api.jsp)

## Architecture
Trustee is based around Docker containers.  This repository source code is for the Trustee core which is Next.JS based application and served by Node.JS.  Deployment of individual Docker containers which includes the patient health record powered by [NOSH](https://github.com/shihjay2/nosh3) specific to only one patient/user is demonstrated by this project.

The docker-compose.yml (template found in docker-compose.tmp under the docker directory) defines the specific containers that when working together, allow Trustee to be able to fully featured (e.g. a bundle).  Below are the different containers and what they do:
#### 1. [Traefik](https://doc.traefik.io/traefik/providers/docker/) - this is the router, specifying the ports and routing to the containers in the bundle 
#### 2. [CouchDB](https://couchdb.apache.org/) - this is the NoSQL database that stores all documents
#### 3. [NOSH](https://github.com/shihjay2/nosh3) - this is the Node.js based server application
#### 4. [Watchtower](https://github.com/containrrr/watchtower) - this service pulls and applies updates to all Docker Images in the bundle automatically without manager intervention

## Developer API

Get all patients
```
GET /api/couchdb/patients/all
```

## Grant Negotiation and Authorization Protocol (GNAP)
Trustee also functions as an Authorization Server as specified by the [Grant Negotiation and Authorization Protocol](https://www.ietf.org/archive/id/draft-ietf-gnap-core-protocol-12.html#name-introduction).

#### 1. Requesting Access
Client sends HTTP POST to the grant endpoint of Trustee with the following headers and body.  The Content-Digest, Signature, and Signature-Input fields and how they are constructed are [described here](https://www.ietf.org/archive/id/draft-ietf-gnap-core-protocol-12.html#name-http-message-signatures).  It is imperative that the processes outlined in the aformentioned link are followed explicitly as Trustee verifies these header fields with the public key presented in the request body (client.key field)
NOTE: Trustee currently only accepts JSON Web Keys for the public key presentation at this time (in the client.key field)
```
POST /api/as/tx
Content-Type: application/json
Signature-Input: sig1=...
Signature: sig1=:...
Content-Digest: sha-256=...
{
  "access_token": {
    "access": [
      {
        "type": "app",
        "actions": [
          "read",
          "write"
        ],
        "locations": [
          "https://nosh-app-mj3xd.ondigitalocean.app/app/chart/nosh_49798bcb-c617-4165-beb6-05442152c99a"
        ],
        "datatypes": [
          "application"
        ]
      },
      {
        "type": "conditions",
        "actions": [
          "read",
          "write"
        ],
        "locations": [
          "https://nosh-app-mj3xd.ondigitalocean.app/fhir/api/Condition"
        ],
        "datatypes": [
          "application/json"
        ]
      }
    ]
  },
  "client": {
    "display": {
      "name": "My Client Display Name",
      "uri": "https://client.example.net"
    },
    "key": {
      "proof": "httpsig",
      "jwk": {
        "kty": "RSA",
        "e": "AQAB",
        "kid": "xyz-1",
        "alg": "RS256",
        "n": "kOB5rR4Jv0GMeL...."
      }
    }
  },
  "interact": {
    "start": ["redirect"],
    "finish": {
      "method": "redirect",
      "uri": "https://client.example.net/return/123455",
      "nonce": "LKLTI25DK82FX4T4QFZC"
    }
  },
  "subject": {
    "sub_id_formats": ["iss_sub", "opaque"],
    "assertion_formats": ["id_token"]
  }
}

```
If verified successfuly, Trustee responds with:
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
    "interact": {
      "redirect":
        "https://server.example.com/api/as/interact/4CF492MLVMSW9MKM",
      "finish": "MBDOFXG4Y5CVJCX821LH"
    }
    "continue": {
      "access_token": {
        "value": "80UPRY5NM33OMUKMKSKU"
      },
      "uri": "https://server.example.com/api/as/continue"
    },
    "instance_id": "7C7C4AZ9KHRS6X63AJAO"
}
```

