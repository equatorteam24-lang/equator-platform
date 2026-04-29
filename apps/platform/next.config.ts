import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@uniframe/db', '@uniframe/ui', '@uniframe/config'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.figma.com' },
    ],
  },
}

export default nextConfig
