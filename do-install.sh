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
  read -e -p "Enter your DigitalOcean API Token: " -i "" DIGITALOCEAN_API_TOKEN
  read -e -p "Enter your CouchDB/Traefik Password for admin user: " -i "" COUCHDB_PASSWORD
  read -e -p "Enter your Sendgrid API Key: " -i "" SENDGRID_API_KEY
  read -e -p "Enter your Magic Secret: " -i "" MAGIC_SECRET_KEY
  read -e -p "Enter your Magic API Key for Trustee: " -i "" MAGIC_PUB_KEY
  read -e -p "Enter your Magic API Key for NOSH: " -i "" MAGIC_API_KEY 
  read -e -p "Enter your USPSTF API Key for NOSH: " -i "" USPSTF_KEY
  read -e -p "Enter your UMLS API Key for NOSH: " -i "" UMLS_KEY
  cp ./docker/traefik/traefik.tmp ./docker/traefik/traefik.yml
  cp ./docker/traefik/docker-compose.tmp ./docker/traefik/docker-compose.yml
  cp ./docker/trusteecommunity/docker-compose.tmp ./docker/trusteecommunity/docker-compose.yml
  sed -i "s/example@example.com/$EMAIL/" ./docker/traefik/traefik.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/traefik/docker-compose.yml
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/trusteecommunity/docker-compose.yml
  cp ./env ./docker/trusteecommunity/.env.local
  sed -i "s/example.com/$ROOT_DOMAIN/" ./docker/trusteecommunity/.env.local
  KEY=$(curl https://generate-secret.vercel.app/32)
  sed -i "s/example.key/$KEY/" ./docker/trusteecommunity/.env.local
  sed -i '/^DIGITALOCEAN_API_TOKEN=/s/=.*/='"$DIGITALOCEAN_API_TOKEN"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^SENDGRID_API_KEY=/s/=.*/='"$SENDGRID_API_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^MAGIC_SECRET_KEY=/s/=.*/='"$MAGIC_SECRET_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^MAGIC_PUB_KEY=/s/=.*/='"$MAGIC_PUB_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^MAGIC_API_KEY=/s/=.*/='"$MAGIC_API_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^USPSTF_KEY=/s/=.*/='"$USPSTF_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^UMLS_KEY=/s/=.*/='"$UMLS_KEY"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^COUCHDB_USER=/s/=.*/='"admin"'/' ./docker/trusteecommunity/.env.local
  sed -i '/^COUCHDB_PASSWORD=/s/=.*/='"$COUCHDB_PASSWORD"'/' ./docker/trusteecommunity/.env.local
  . ~/.nvm/nvm.sh
  nvm install node
  nvm install-latest-npm
  npm install -g htpasswd
  TRAEFIK_PASS=$(echo $(htpasswd -nb admin $COUCHDB_PASSWORD) | sed -e 's/\$/\$\$/g')
  sed -i "s@admin:your_encrypted_password@$TRAEFIK_PASS@" ./docker/traefik/docker-compose.yml
  mkfifo ./docker/traefik/pipe
  cp pipe.service /etc/systemd/system/pipe.service
  systemctl enable pipe.service
  systemctl start pipe.service
  echo "Command pipe service enabled and running..."
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
  # start dockers
  cd ./docker/traefik
  /usr/bin/docker compose up -d
  cd ../watchtower
  /usr/bin/docker compose up -d
  cd ../trusteecommunity
  /usr/bin/docker compose up -d
  echo "Initializing CouchDB and Trustee Community..."
  sleep 5
  curl -X PUT http://admin:$COUCHDB_PASSWORD@localhost:5984/patients
  curl -X PUT http://admin:$COUCHDB_PASSWORD@localhost:5984/droplets
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
