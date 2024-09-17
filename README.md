# Trustee Community

#### Check out the wiki for sequence diagram and more https://github.com/HIEofOne/Trustee-Community/wiki 

Trustee Community is the code repository a community manager can fork to create a new patient community.

To create a new patient community, a manger will need these prequisites:
- An account at [DigitalOcean](https://digitalocean.com) to pay for hosting the community members Trustees (patient-controlled health records),
- A domain name for the community,
- A privacy policy describing the initial configuration of Trustee access policies and how subscribers can change the policies if they choose.
- (optional) An account at Stripe to collect credit card payments for Trustee subscriptions hosted by the community (future state)

## Installation
#### 1. Gather all API keys and Link Accounts
- In order to complete this installation, you will need to set up some API keys and services for the application to interact with. Details [can be found here.](#more-on-additional-api-services)
- [link your GitHub account to DigitalOcean](https://cloud.digitalocean.com/apps/github/install)
#### 2. Create a DigitalOcean Droplet with the minimum parameters:
- size: 's-1vcpu-1gb',
- image: 'ubuntu-22-10-x64'
#### 3. Ensure your domain name is associated with the IP of your DigitalOcean Droplet. 
[More information here.](https://docs.digitalocean.com/products/networking/dns/how-to/add-domains/)
#### 4. Login to the console as the root user and enter this command:

```
git clone -b master --single-branch https://github.com/HIEofOne/Trustee-Community.git
cd Trustee-Community
./do-install.sh
```
#### 5. The first pass will install all dependencies.  Logout and login to the droplet.

```
exit
cd Trustee-Community
./do-install.sh
```
The second pass will install and configure the application for use. 

#### 6. Open your browser to https://mydomain.xyz
- Other notable endpoints with your Trustee include:
- https://db.mydomain.xyz which points to the [CouchDB](https://couchdb.apache.org/) database used to store user account information (just email) and droplet info.
- https://noshdb.mydomain.xyz whihc points to the NOSH [CouchDB](https://couchdb.apache.org) database instance used to store encrypted health information for the [NOSH3](https://github.com/shihjay2/nosh3) in DigitalOcean App Platform.
- https://router.mydomain.xyz which points to the [Traefik](https://doc.traefik.io/traefik/providers/docker/) reverse proxy router
#### 7. Set up [GitHub Action - Sync Upstream Repo Fork](https://github.com/marketplace/actions/sync-and-merge-upstream-repository-with-your-current-repository)
##### Auto sync the [NOSH3](https://github.com/shihjay2/nosh3) codebase which is used to update the creation of your DigitalOcean App Platform image.  
- in GitHub, go to the recently forked repository for nosh3 in your organization account.
- click on Actions
- Enable all workflows to start (you may receive an error with the Docker Image CI workflow run, just ignore)
- on the left, there are 2 workflows (Docker Image CI and Sync NOSH3 Upstream).
- in Docker Image CI, click on the 3 dots on the right-hand side (Show wokflow options), and click Disable Workflow


### Troubleshooting:
- If you receive the error "the NOSH app id is null" this means there is an error in the github setup.

- In order to roll back a failed installation, you must:
  1. Rebuild the digital ocean droplet (In the "Destroy" section of the DO droplet dashboard). NOTE: This will reset the admin password, so remember to check your email after the rebuild to reset admin password as you did when you originally set up the droplet.
  2. Delete the nosh fork in github
  3. Delete the nosh app in digital ocean
  4. Remove any created passkeys from your browser. 

- Once you have the app resolving at the correct domain, there is console output during setup which should help to isolate any email or other configuration errors.
 - During install, you may run into two prompts which look like this:
  ![Prompt 1](/public/readmepics/install_ss_1.jpg)
  and this:
  ![Prompt 2](/public/readmepics/install_ss_2.jpg)

  You can safely accept the default choices on both of these screens.

<a name="#more-on-additional-api-services"></a>
## More on Additional API Services

This is a list of the accounts / keys you will need to assemble before installing:
Here???s the information with "IMPORTANT:" wrapped in a span and colored red:

- **GitHub Organization Name**  
  This is the full name of your GitHub organization, for example: HIEofOne.  
  <span style="color: red;">IMPORTANT:</span> This value is case sensitive.

- **GitHub Personal Access Token**  
  A personal access token for authenticating GitHub API requests. This is used to create a fork of the NOSH repository inside your account or organization. Instructions can be found here.

- **Host Server URL**  
  The URL where the host server will reside.  
  <span style="color: red;">IMPORTANT:</span> You may need to make changes to the DNS entries of this domain name to get the installer to work properly with AWS Simple Email Service. The application will also send emails from an address at this domain.

- **Email for SSL Certificate from Let's Encrypt**  
  The email address used to request an SSL certificate from Let's Encrypt. This should be your email address, either business or personal.

- **MAIA Application URL**  
  The URL at which the MAIA application can be found.

- **DigitalOcean API Key**  
  API key for accessing DigitalOcean services. This will be used to create the NOSH application specific to this installation of Trustee.

- **CouchDB or Traefik Password**  
  Password for CouchDB or Traefik access. This is an invented value, not one obtained from elsewhere.

- **Sender Email Address**  
  The email address used as the sender for outbound communications. It should probably match the domain of the application server, so if the server is zombo.com, this should be something like info@zombo.com.

- **Amazon SES Access Key**  
  Access key for Amazon Simple Email Service (SES). See notes below for full setup instructions.

- **Amazon SES Secret Key**  
  Secret key associated with the Amazon SES access key.

- **AWS Region**  
  The AWS region where resources are hosted. This is chosen during SES setup, as outlined below.

- **Magic API Secret**  
  Secret key for the Magic authentication API. See notes below for full setup instructions.

- **Magic API Key for Trustee**  
  Public API key for Magic authentication specific to the Trustee application.

- **Magic API Key for NOSH**  
  Public API key for Magic authentication specific to the NOSH application.

- **USPSTS Key**  
  US Preventive Services Task Force key. See notes below for full setup instructions.

- **UMLS API Key**  
  API key for accessing the Unified Medical Language System (UMLS). See notes below for full setup instructions.

If you're implementing this in HTML, the red color will display correctly when rendered in a browser.
### AWS SES Setup

#### **Step 1: Sign Up for AWS Free Tier**

1. **Create an AWS Account**:
   - Go to the [AWS Free Tier Sign Up page](https://aws.amazon.com/free/).
   - Click on **"Create a Free Account."**
   - Fill in your details, including an email address, password, and AWS account name.
   - Continue through the setup, providing required information, including billing details (a valid credit card is required, but you won???t be charged as long as you stay within the free tier limits).

2. **Verify Your Email and Identity**:

3. **Choose a Support Plan**:
   - For the free tier, select the **"Basic Support - Free"** option.
   
4. **Log In to AWS Management Console**:
   - Once your account is set up, log in to the [AWS Management Console](https://aws.amazon.com/console/).

#### **Step 2: Set Up Amazon SES**

1. **Access Amazon SES**:
   - In the AWS Management Console, search for **"SES"** in the search bar and select **"Simple Email Service"**.

2. **Select a Region**:
   - SES is region-specific, so ensure you select the AWS region where you want to send emails. Check the region selection in the top-right corner of the console. You will need this information for the Trustee installer.

3. **Create an Identity (Domain)**:
   - Click **"Verified identities"** in the SES dashboard.
   - Choose to **"Create Identity"** and select **"Domain"** as your identity type. Enter your domain name and follow the instructions to add DNS records (TXT, CNAME, MX, etc.) to your domain's DNS settings for verification.

#### **Step 3: Request to Move Out of Sandbox Mode**

By default, new SES accounts are placed in sandbox mode, which restricts sending capabilities that will prevent Trustee from working correctly. In order to solve this, you must request that your account be moved out of sandbox mode:

1. **Go to the SES Dashboard**:

2. **Request Production Access**:

3. **Fill Out the SES Sending Limit Increase Form**:

#### **Additional Links**

- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Management Console](https://aws.amazon.com/console/)
- [SES Documentation](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/Welcome.html)


### [Magic](https://magic.link/) instructions:

1. Set up an account for free by visiting [Magic](https://magic.link).  Click on Start now.
2. Once you are in the [dashboard](https://dashboard.magic.link/app/all_apps), go to Magic Auth and click on New App.  Enter the App Name (My App Powered by Trustee) and hit Create App.
3. Once you are in the home page for the app, scroll down to API Keys and copy the PUBISHABLE API KEY value.  This API Key will be usee to interact with Magic's APIs
   
### [National Library of Medicine UMLS Terminology Services](https://uts.nlm.nih.gov/uts/) 
##### Allow search queries for SNOMED CT LOINC, and RXNorm definitions.

1. Set up an account [here](https://uts.nlm.nih.gov/uts/signup-login)
2. [Edit your profile](https://uts.nlm.nih.gov/uts/edit-profile) and click on Generate new API Key.  Copy this API key.
   
### [US Preventive Services Task Force](https://www.uspreventiveservicestaskforce.org/apps/api.jsp)
##### Provides Care Opportunties guidance based on USPSTF guidelines

1. [Visit this site for instructions](https://www.uspreventiveservicestaskforce.org/apps/api.jsp)

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

