/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',       // fallback if env not set
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',   // fallback if env not set
    AUTH_SECRET: process.env.AUTH_SECRET || '',         // fallback if env not set
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
