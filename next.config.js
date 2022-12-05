/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    serverRuntimeConfig: {
        DIGITALOCEAN_API_TOKEN: process.env.DIGITALOCEAN_API_TOKEN,
        DIGITALOCEAN_SSH_KEY_ID: process.env.DIGITALOCEAN_SSH_KEY_ID,
        NEXT_PUBLIC_MAGIC_PUB_KEY: process.env.NEXT_PUBLIC_MAGIC_PUB_KEY,
        NEXT_PUBLIC_COUCH_USERNAME: process.env.NEXT_PUBLIC_COUCH_USERNAME,
        NEXT_PUBLIC_COUCH_PASSWORD: process.env.NEXT_PUBLIC_COUCH_PASSWORD,
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        DOMAIN: process.env.DOMAIN,
        MAGIC_API_KEY: process.env.MAGIC_API_KEY,
        USPSTF_KEY: process.env.USPSTF_KEY,
        UMLS_KEY: process.env.UMLS_KEY,
        OIDC_RELAY_URL: process.env.OIDC_RELAY_URL,
        NODE_ENV: process.env.NODE_ENV,
        MAGIC_SECRET_KEY: process.env.MAGIC_SECRET_KEY,
        ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET
    }
}

module.exports = nextConfig