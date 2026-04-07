import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@equator/db', '@equator/ui', '@equator/config'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.figma.com' },
    ],
  },
}

export default nextConfig
