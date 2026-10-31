import { NextResponse } from 'next/server';

/**
 * Digital Asset Links for the Android (Trusted Web Activity) app, served at
 * /.well-known/assetlinks.json via a rewrite in next.config.ts.
 *
 * ANDROID_CERT_SHA256 = comma-separated SHA-256 fingerprints: the Play
 * "App signing key" (Play Console → Test and release → App integrity) and
 * the upload key used for local test builds.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.kisaansevak.app';
  const fingerprints = (process.env.ANDROID_CERT_SHA256 || '')
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);

  const body = fingerprints.length
    ? [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: { namespace: 'android_app', package_name: packageName, sha256_cert_fingerprints: fingerprints },
        },
      ]
    : [];

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
