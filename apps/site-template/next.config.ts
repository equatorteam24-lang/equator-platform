import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@equator/db', '@equator/ui', '@equator/config'],
}

export default nextConfig
