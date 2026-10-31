import type {NextConfig} from 'next';
import appletConfig from './firebase-applet-config.json';

const firebaseProjectId = appletConfig.projectId;

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
  async rewrites() {
    const authHost = `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseProjectId}.firebaseapp.com`;
    return [
      { source: '/.well-known/assetlinks.json', destination: '/api/assetlinks' },
      // Serve Firebase Auth's sign-in helper from our own domain so Google
      // sign-in works inside the Android app and browsers that block
      // third-party storage. See https://firebase.google.com/docs/auth/web/redirect-best-practices
      { source: '/__/auth/:path*', destination: `https://${authHost}/__/auth/:path*` },
      { source: '/__/firebase/:path*', destination: `https://${authHost}/__/firebase/:path*` },
    ];
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
