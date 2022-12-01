#!/bin/bash
# update script for Trustee-Community in a DigitalOcean Ubuntu Droplet
set -e
if [[ $EUID -ne 0 ]]; then
	echo "This script must be run as root.  Aborting." 1>&2
	exit 1
fi
if [ -d "${HOME}/.nvm/.git" ]; then
  echo "Updating Trustee-Community..."
  git pull
  npm ci
  npm run build
  pm2 restart Trustee-Community
  # restart dockers
  cd ./docker/traefik
  /usr/bin/docker compose down
  /usr/bin/docker compose up -d
  cd ../watchtower
  /usr/bin/docker compose down
  /usr/bin/docker compose up -d
  cd ../couchdb
  /usr/bin/docker compose down
  /usr/bin/docker compose up -d
  echo "Update complete.  You can now open your browser to https://trustee.$ROOT_DOMAIN" 
  exit 0
else
  echo "NVM not installed.  Run installation script at do-install.sh"  
  exit 0
fi
