# Trustee Community

#### Check out the wiki for sequence diagram and more https://github.com/HIEofOne/Trustee-Community/wiki 

Trustee Community is the code repository a community manager can fork to create a new patient community.

To create a new patient community, a manger will need these four things:
- An account at DigtialOcean to pay for hosting the community members Trustees (patient-controlled health records),
- An account at Stripe to collect credit card payments for Trustee subscriptions hosted by the community,
- A domain name for the community,
- A privacy policy describing the initial configuration of Trustee access policies and how subscribers can change the policies if they choose.# Getting Started

These steps will get this sample Flask application running for you using DigitalOcean App Platform.

## Installation
#### 1. Gather all API keys for Magic, USPSTF, UMLS, DigitalOcean, and SendGrid
- have these ready for the installer in step 4
- details on getting API keys are in the section [More on Additional API Services](#more-on-additional-api-services)
- assume you have a domain name (mydomain.xyz) and email address needed for LetsEncrypt SSL (my@email.xyz)
#### 2. Create a DigitalOcean Droplet with the minimum parameters:
- size: 's-1vcpu-1gb',
- image: 'ubuntu-22-10-x64'
#### 3. Login to the console (should be root user) and enter this command:
```
git clone -b deploy --single-branch https://github.com/HIEofOne/Trustee-Community.git
cd Trustee-Community
./do-install.sh
```
#### 4. The first pass will install all dependencies.  Logout and login to the droplet.
```
exit
cd Trustee-Community
./do-install.sh
```
#### 5. Open your browser to https://mydomain.xyz
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

## The instructions below will FAIL. There are many problems still to be fixed.

--- More to follow ---







**Note: Following these steps may result in charges for the use of DigitalOcean services**

## Requirements

* You need a DigitalOcean account. If you don't already have one, you can sign up at https://cloud.digitalocean.com/registrations/new
    
## Deploying the App

Click this button to deploy the app to the DigitalOcean App Platform. If you are not logged in, you will be prompted to log in with your DigitalOcean account.

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/digitalocean/sample-flask/tree/main)

Using this button disable the "Auto deploy changes on push" feature as you are using this repo directly. If you wish to try that feature, you will need to make your own copy of this repository.

To make a copy, click the Fork button above and follow the on-screen instructions. In this case, you'll be forking this repo as a starting point for your own app (see [GitHub documentation](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) to learn more about forking repos.

After forking the repo, you should now be viewing this README in your own github org (e.g. `https://github.com/<your-org>/sample-flask`). To deploy the new repo, visit https://cloud.digitalocean.com/apps and click "Create App" or "Launch Your App". Then, select the repository you created and be sure to select the `main` branch.

After clicking the "Deploy to DigitalOcean" button or completing the instructions above to fork the repo, follow these steps:

1. Select which region you wish to deploy your app to and click Next. The closest region to you should be selected by default. All App Platform apps are routed through a global CDN so this will not affect your app performance, unless it needs to talk to external services.
1. On the following screen, leave all the fields as they are and click Next.
1. Confirm your Plan settings and how many containers you want to launch and click **Launch Basic/Pro App**.
1. You should see a "Building..." progress indicator. And you can click "Deployments"→"Details" to see more details of the build.
1. It can take a few minutes for the build to finish, but you can follow the progress by clicking the "Details" link in the top banner.
1. Once the build completes successfully, click the "Live App" link in the header and you should see your running application in a new tab, displaying the home page.

## Making Changes to Your App

If you followed the steps above to fork the repo and used your own copy when deploying the app, you can enjoy automatic deploys whenever changes are made to the repo. During these automatic deployments, your application will never pause or stop serving request because App Platform offers zero-downtime deployments.

Here's an example code change you can make for this app:

1. Edit `templates/index.html` and replace "Welcome to your new Flask App!" with a different greeting
1. Commit the change to the `main` branch. Normally it's a better practice to create a new branch for your change and then merge that branch to `main` after review, but for this demo you can commit to the `main` branch directly.
1. Visit https://cloud.digitalocean.com/apps and navigate to your sample app.
1. You should see a "Building..." progress indicator, just like when you first created the app.
1. Once the build completes successfully, click the "Live App" link in the header and you should see your updated application running. You may need to force refresh the page in your browser (e.g. using Shift+Reload).

## Learn More

You can learn more about the App Platform and how to manage and update your application at https://www.digitalocean.com/docs/app-platform/.

## Deleting the App

When you no longer need this sample application running live, you can delete it by following these steps:
1. Visit the Apps control panel at https://cloud.digitalocean.com/apps
1. Navigate to the sample app
1. Choose "Settings"->"Destroy"

**Note: If you don't delete your app, charges for the use of DigitalOcean services will continue to accrue.**
