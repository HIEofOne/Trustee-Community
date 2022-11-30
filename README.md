# Trustee Community

#### Check out the wiki for sequence diagram and more https://github.com/HIEofOne/Trustee-Community/wiki 

Trustee Community is the code repository a community manager can fork to create a new patient community.

To create a new patient community, a manger will need these four things:
- An account at DigtialOcean to pay for hosting the community members Trustees (patient-controlled health records),
- An account at Stripe to collect credit card payments for Trustee subscriptions hosted by the community (Not yet implemented),
- A domain name for the community,
- A privacy policy describing the initial configuration of Trustee access policies and how subscribers can change the policies if they choose.# Getting Started

These steps will get this next.js application running for you using DigitalOcean.

**Note: Following these steps may result in charges for the use of DigitalOcean services**

## Requirements

* You need a DigitalOcean account. If you don't already have one, you can sign up at https://cloud.digitalocean.com/registrations/new

## Test Localy
1. Install [couchdb]([url](https://couchdb.apache.org/))
2. Download code and navigate to directory
3. Make a new .env.local file (follow instructions in [example](env_setup.md))
4. `npm install`
5. `npm run dev`

    
## Deploying the App on Digital Ocean

1. Create a new Droplet (Droplet minimum specs: 1 GB Memory / 25 GB Disk)
2. Install couch db. Use [official guide]([url](https://docs.couchdb.org/en/3.2.2-docs/install/unix.html))
    1. Use standalone configuration
    2. Magic cookie can be anything
    3. Leave blind address alone
    4. Set password
3. Download and deploy app. Here is a tutorial: https://www.coderrocketfuel.com/article/how-to-deploy-a-next-js-website-to-a-digital-ocean-server#create-and-configure-a-digitalocean-server
4. Make a new .env.local file (follow instructions in [example](env_setup.md))
5. rebuild and deploy website
```
npm install
npm run build
pm2 restart website
```

## Developer Api

Get all patients

`GET /api/couchdb/patients/all`

Get all rs requests

`GET /api/couchdb/requests/all`

