/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log(`Next.js config loaded with proxy to ${apiUrl}/api/`);
    
    return [
      // Explicit rules for auth endpoints with trailing slashes
      {
        source: '/api/v1/auth/token/',
        destination: `${apiUrl}/api/v1/auth/token/`, // Explicit rule for auth token
      },
      {
        source: '/api/v1/users/me/',
        destination: `${apiUrl}/api/v1/users/me/`, // Explicit rule for user profile
      },
      // General rules for other endpoints
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // Proxy to Backend using env variable
      },
      {
        source: '/api/:path*/',
        destination: `${apiUrl}/api/:path*/`, // Proxy with trailing slash
      },
      {
        source: '/shared-pdf/:uuid',
        destination: '/shared/pdf/:uuid', // Internal rewrite for shared PDF links
      },
      {
        source: '/shared-html/:uuid',
        destination: '/shared/html/:uuid', // Internal rewrite for shared HTML links
      },
      {
        source: '/api/v1/shared-pdf/:uuid',
        destination: `${apiUrl}/api/v1/shared-pdf/:uuid`, // Proxy to backend API
      },
      {
        source: '/api/v1/shared-html/:uuid',
        destination: `${apiUrl}/api/v1/shared-html/:uuid`, // Proxy to backend API
      },
      {
        source: '/api/v1/shared-html/:uuid/',
        destination: `${apiUrl}/api/v1/shared-html/:uuid/`, // Proxy to backend API with trailing slash
      }
    ]
  }
}


module.exports = nextConfig
