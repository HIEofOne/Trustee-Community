#!/bin/bash
# install script for Trustee-Community in a DigitalOcean Ubuntu Droplet
set -e
if [[ $EUID -ne 0 ]]; then
	echo "This script must be run as root.  Aborting." 1>&2
	exit 1
fi
if [ -d "${HOME}/.nvm/.git" ]; then
  echo "NVM installed.  Personalizing Trustee-Community..."
  read -e -p "Enter your GitHub Organization: " -i "" GITHUB_ORG
  read -e -p "Enter your GitHub Access Token: " -i "" GITHUB_TOKEN
  curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/shihjay2/nosh3/forks \
  -d '{"organization":"$GITHUB_ORG","name":"nosh3","default_branch_only":true}'
  curl -O https://gist.githubusercontent.com/mathieucarbou/96ab30024f0d3fb44cac970219d23efc/raw/b15e98de1a41bd02b38b14f0ae9a0cbc422dfe70/github-fork-sync.sh
  chmod a+x github-fork-sync.sh
  ./github-fork-sync.sh $GITHUB_ORG/nosh3 shihjay2/nosh3 main
  # set domain entries
  read -e -p "Enter your Root Domain Name (domain.com): " -i "" ROOT_DOMAIN
  read -e -p "Enter your E-Mail address for Let's Encrypt (your@email.com): " -i "" EMAIL
  read -e -p "Enter your DigitalOcean API Token: " -i "" DIGITALOCEAN_API_TOKEN
  read -e -p "Enter your CouchDB/Traefik Password for admin user: " -i "" COUCHDB_PASSWORD
  read -e -p "Enter your From Email: " -i "" FROM_EMAIL
  cp ./env ./docker/trusteecommunity/.env.local
  PS3="Enter email type: "
  mailtypes=("sendgrid" "smtp" "aws")
  select MAIL_TYPE in "${mailtypes[@]}"; do
    case $MAIL_TYPE in
      "sendgrid")
        read -e -p "Enter your Sendgrid API Key: " -i "" SENDGRID_API_KEY
        sed -i '/^SENDGRID_API_KEY=/s/=.*/='"$SENDGRID_API_KEY"'/' ./docker/trusteecommunity/.env.local
        break
        ;;
      "smtp")
        read -e -p "Enter your SMTP Host URL: " -i "" SMTP_HOST
        read -e -p "Enter your SMTP Port: " -i "" SMTP_PORT
        read -e -p "Enter your SMTP Username: " -i "" SMTP_USER
        read -e -p "Enter your SMTP Password: " -i "" SMTP_PASSWORD
        sed -i '/^SMTP_HOST=/s/=.*/='"$SMTP_HOST"'/' ./docker/trusteecommunity/.env.local
        sed -i '/^SMTP_PORT=/s/=.*/='"$SMTP_PORT"'/' ./docker/trusteecommunity/.env.local
        sed -i '/^SMTP_USER=/s/=.*/='"$SMTP_USER"'/' ./docker/trusteecommunity/.env.local
        sed -i '/^SMTP_PASSWORD=/s/=.*/='"$SMTP_PASSWORD"'/' ./docker/trusteecommunity/.env.local
        break
        ;;
      "aws")
        read -e -p "Enter your AWS Access Key: " -i "" AWS_ACCESS_KEY
        read -e -p "Enter your AWS Secret: " -i "" AWS_SECRET_ACCESS_KEY
        sed -i '/^AWS_ACCESS_KEY=/s/=.*/='"$AWS_ACCESS_KEY"'/' ./docker/trusteecommunity/.env.local
        sed -i '/^AWS_SECRET_ACCESS_KEY=/s/=.*/='"$AWS_SECRET_ACCESS_KEY"'/' ./docker/trusteecommunity/.env.local
        break
        ;;
      *)
        echo "Invalid option $REPLY"
        ;;
    esac
  done
  read -e -p "Enter your Magic Secret: " -i "" MAGIC_SECRET_KEY
  read -e -p "Enter your Magic API Key for Trustee: " -i "" MAGIC_PUB_KEY
  read -e -p "Enter your Magic API Key for NOSH: " -i "" MAGIC_API_KEY 
  read -e -p "Enter your USPSTF API Key for NOSH: " -i "" USPSTF_KEY
  read -e -p "Enter your UMLS API Key for NOSH: " -i "" UMLS_KEY
  cp ./docker/traefik/traefik.tmp ./docker/traefik/traefik.yml
  cp ./docker/traefik/docker-compose.tmp ./docker/traefik/docker-compose.yml
  cp ./docker/trusteecommunity/docker-compose.tmp ./docker/trusteecommunity/docker-compose.yml
  cp ./docker/noshdb/docker-compose.tmp ./docker/noshdb/docker-compose.yml
  sed -i "s/example@example.com/$EMAIL/" ./docker/traefik/traefik.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/traefik/docker-compose.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/trusteecommunity/docker-compose.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/trusteecommunity/.env.local
  sed -i '/^FROM_EMAIL=/s/=.*/='"$FROM_EMAIL"'/' ./docker/trusteecommunity/.env.local
  KEY=$(curl https://generate-secret.vercel.app/32)
  sed -i "s/example.key/$KEY/" ./docker/trusteecommunity/.env.local
  sed -i '/^DIGITALOCEAN_API_TOKEN=/s/=.*/='"$DIGITALOCEAN_API_TOKEN"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^MAGIC_SECRET_KEY=/s/=.*/='"$MAGIC_SECRET_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^MAGIC_PUB_KEY=/s/=.*/='"$MAGIC_PUB_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^MAGIC_API_KEY=/s/=.*/='"$MAGIC_API_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^USPSTF_KEY=/s/=.*/='"$USPSTF_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^UMLS_KEY=/s/=.*/='"$UMLS_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^COUCHDB_USER=/s/=.*/='"admin"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^COUCHDB_PASSWORD=/s/=.*/='"$COUCHDB_PASSWORD"'/' ./docker/trusteecommunity/.env.local
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/noshdb/docker-compose.yml
  cp ./docker/noshdb/env ./docker/noshdb/.env.local
  sed -i '/^COUCHDB_USER=/s/=.*/='"admin"'/' ./docker/noshdb/.env.local
  sed -i '/^COUCHDB_PASSWORD=/s/=.*/='"$COUCHDB_PASSWORD"'/' ./docker/noshdb/.env.local
  . ~/.nvm/nvm.sh
  nvm install node
  nvm install-latest-npm
  npm install -g htpasswd
  TRAEFIK_PASS=$(echo $(htpasswd -nb admin $COUCHDB_PASSWORD) | sed -e 's/\$/\$\$/g')
  sed -i "s@admin:your_encrypted_password@$TRAEFIK_PASS@" ./docker/traefik/docker-compose.yml
  ssh-keygen -t ed25519 -N "" -f /root/.ssh/id_ed25519
  DIGITALOCEAN_PUB_KEY=$(</root/.ssh/id_ed25519.pub)
ssh_post_data()
{
  cat <<EOF
{
  "name": "Trustee Root Public Key",
  "public_key": "$DIGITALOCEAN_PUB_KEY"
}
EOF
}
  DIGITALOCEAN_SSH_KEY_ID=`curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN" \
  -d "$(ssh_post_data)" \
  "https://api.digitalocean.com/v2/account/keys" | jq '.ssh_key.id'`
  sed -i '/^DIGITALOCEAN_SSH_KEY_ID=/s/=.*/='"$DIGITALOCEAN_SSH_KEY_ID"'/' ./docker/trusteecommunity/.env.local
  echo "Root SSH key generated and uploaded to DigitalOcean"
ssh_post_data1()
{
  cat <<EOF
{
  "spec": {
    "name": "nosh-app",
    "region": "nyc3",
    "services": [
      {
        "name": "nosh",
        "github": {
          "branch": "main",
          "deploy_on_push": true,
          "repo": "$GITHUB_ORG/nosh3"
        },
        "dockerfile_path": "Dockerfile",
        "envs": [
          {"key": "MAGIC_API_KEY", "value": "$MAGIC_API_KEY"},
          {"key": "COUCHDB_URL", "value": "https://noshdb.$ROOT_DOMAIN"},
          {"key": "COUCHDB_USER", "value": "admin"},
          {"key": "COUCHDB_PASSWORD", "value": "$COUCHDB_PASSWORD"},
          {"key": "INSTANCE", "value": "digitalocean"},
          {"key": "TRUSTEE_URL", "value": "https://$ROOT_DOMAIN"},
          {"key": "NOSH_ROLE", "value": "patient"},
          {"key": "AUTH", "value": "magic"},
          {"key": "USPSTF_KEY", "value": "$USPSTF_KEY"},
          {"key": "UMLS_KEY", "value": "$UMLS_KEY"},
          {"key": "OIDC_RELAY_URL", "value": "$OIDC_RELAY_URL"}
        ],
        "routes": [
          {"path": "/"}
        ]
      }
    ]
  }
}
EOF
}
  DIGITALOCEAN_APP_ID=`curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN" \
  -d "$(ssh_post_data1)" \
  "https://api.digitalocean.com/v2/apps" | jq -r '.app.id'`
  echo "The NOSH app id is $DIGITALOCEAN_APP_ID"
  counter=0
  app_status=0
  while [[ $app_status -eq 0 && $counter -le 400 ]]
  do
    sleep 5
    APP_URL=`curl -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN" \
    "https://api.digitalocean.com/v2/apps/$DIGITALOCEAN_APP_ID" | jq -r '.app.default_ingress'`
    if [ "$APP_URL" != "null" ]
    then
      app_status=1
      sed -i '/^APP_URL=/s,=.*,='"$APP_URL"',' ./docker/trusteecommunity/.env.local
    else
      counter=$(( $counter + 1 ))
    fi
  done
  echo "NOSH App is now active at $APP_URL"
  # start dockers
  cd ./docker/traefik
  /usr/bin/docker compose up -d
  cd ../watchtower
  /usr/bin/docker compose up -d
  cd ../trusteecommunity
  /usr/bin/docker compose up -d
  cd ../noshdb
  /usr/bin/docker compose up -d
  echo "Initializing CouchDB and Trustee Community..."
  sleep 5
  echo "Installation complete.  You can now open your browser to https://$ROOT_DOMAIN" 
  exit 0
else
  echo "NVM not installed.  Installing all dependencies for Trustee-Community..."  
  apt update
  # install dependencies
  apt install -y apt-transport-https ca-certificates curl software-properties-common jq
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  # get nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
  echo "Now is also a good time to make sure your domain name is associated with the public IP of this droplet."
  echo "Afterwards, logout and log back in and run cd Trustee-Community;./do-install.sh again"
  exit 0
fi
