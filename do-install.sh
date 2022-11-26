#!/bin/bash
# install script for Trustee-Community in a DigitalOcean Ubuntu Droplet
set -e
if [[ $EUID -ne 0 ]]; then
	echo "This script must be run as root.  Aborting." 1>&2
	exit 1
fi
if [ -d "${HOME}/.nvm/.git" ]; then
  echo "NVM installed.  Personalizing Trustee-Community..."
  # set domain entries
  read -e -p "Enter your Root Domain Name (domain.com): " -i "" ROOT_DOMAIN
  read -e -p "Enter your E-Mail address for Let's Encrypt (your@email.com): " -i "" EMAIL
  read -e -p "Enter your CouchDB Password for admin user: " -i "" COUCHDB_PASSWORD
  sed -i "s/example@example.com/$EMAIL/" ./docker/traefik/traefik.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/traefik/docker-compose.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/traefik/routes.yml
  cp ./env ./.env.local
  sed -i "s/example.com/$ROOT_DOMAIN/" ./.env.local
  KEY=$(curl https://generate-secret.vercel.app/32)
  sed -i "s/example.key/$KEY/" ./.env.local
  sed -i '/^NEXT_PUBLIC_COUCH_USERNAME=/s/=.*/='"admin"'/' ./.env.local
  sed -i '/^NEXT_PUBLIC_COUCH_PASSWORD=/s/=.*/='"$COUCHDB_PASSWORD"'/' ./.env.local
  cp ./docker/couchdb/env ./docker/couchdb/.env
  sed -i '/^COUCHDB_USER=/s/=.*/='"admin"'/' ./docker/couchdb/.env
  sed -i '/^COUCHDB_PASSWORD=/s/=.*/='"$COUCHDB_PASSWORD"'/' ./docker/couchdb/.env
  nvm install node
  nvm install-latest-npm
  npm install -g pm2
  pm2 startup systemd
  pm2 install pm2-githook
  echo "Set your Github Webhook with these settings:"
  echo "Payload URL - https://update.$ROOT_DOMAIN/trustee"
  echo "Secret - trustee"
  pm2 set pm2-githook:apps "{\"trustee\":{\"secret\":\"trustee\",\"prehook\":\"npm ci && npm run build\",\"posthook\":\"echo done\",\"errorhook\":\"echo error\",\"service\":\"github\"}}"
  pm2 start --name=Trustee-Community npm -- start
  # start dockers
  cd ./docker/traefik
  /usr/bin/docker compose up -d
  cd ../watchtower
  /usr/bin/docker compose up -d
  cd ../couchdb
  /usr/bin/docker compose up -d
  exit 0
else
  echo "NVM not installed.  Installing all dependencies for Trustee-Community..."  
  apt update
  # install dependencies
  apt install apt-transport-https ca-certificates curl software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  # get nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
  exit 0
fi
