/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    webpack: true,
    webpack(config) {
        config.resolve.fallback = {
          ...config.resolve.fallback,  
          fs: false,
          path: false,
        };
        config.cache = false;
        return config;
      },
}

module.exports = nextConfig