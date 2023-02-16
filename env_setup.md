#copy and paste variables below into new .env.local file

#change domain if not deploying localy
DOMAIN = http://localhost:3000

#sendgrid
#signin to https://sendgrid.com/ then navigate to https://app.sendgrid.com/settings/api_keys and create a new api key
SENDGRID_API_KEY =

#couchdb
#install locally: https://docs.couchdb.org/en/3.2.2-docs/install/index.html
#populate with same username and password
NEXT_PUBLIC_COUCH_USERNAME =
NEXT_PUBLIC_COUCH_PASSWORD =

#magic
#signin at https://magic.link/. In your dashboard create a new app and copy the api keys below.
MAGIC_SECRET_KEY =
NEXT_PUBLIC_MAGIC_PUB_KEY =

#Visit this website to create a secret api key https://generate-secret.vercel.app/32
ENCRYPTION_SECRET =