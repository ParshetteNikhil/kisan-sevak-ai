import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  serverExternalPackages: [
    '@genkit-ai/core',
    '@genkit-ai/ai',
    '@genkit-ai/googleai',
    '@genkit-ai/next',
    'genkit',
    'handlebars',
    'dotprompt',
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
