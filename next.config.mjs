/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https://i.vimeocdn.com https://static.wixstatic.com; connect-src 'self' https://api.recursiv.io; media-src 'self' https://player.vimeo.com https://*.vimeocdn.com; frame-src https://player.vimeo.com; frame-ancestors 'none'" },
          { key: 'X-XSS-Protection', value: '0' },
          // Uncomment if every page load must be unique:
          // { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
