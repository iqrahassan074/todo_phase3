/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'pg': 'pg',
      });
    }
    return config;
  },
};

module.exports = nextConfig;