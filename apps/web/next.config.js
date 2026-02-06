/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy all /api/* requests to your real API base URL (server-side)
    const apiBase = process.env.API_BASE_URL;

    if (!apiBase) {
      // If missing, rewrite will not be applied.
      console.warn("Missing API_BASE_URL env var");
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
