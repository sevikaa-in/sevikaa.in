import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/employer/dashboard',
        destination: '/employer',
        permanent: true,
      },
      {
        source: '/employer/dashboard/:path*',
        destination: '/employer/:path*',
        permanent: true,
      },
      {
        source: '/worker/dashboard',
        destination: '/worker',
        permanent: true,
      },
      {
        source: '/worker/dashboard/:path*',
        destination: '/worker/:path*',
        permanent: true,
      },
      {
        source: '/admin/dashboard',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/admin/dashboard/:path*',
        destination: '/admin/:path*',
        permanent: true,
      },
      {
        source: '/super-admin/dashboard',
        destination: '/super-admin',
        permanent: true,
      },
      {
        source: '/super-admin/dashboard/:path*',
        destination: '/super-admin/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
