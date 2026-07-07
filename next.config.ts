import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/comptes", destination: "/marques", permanent: true },
      { source: "/comptes/:path*", destination: "/marques/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
