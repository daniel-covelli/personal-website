/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;
