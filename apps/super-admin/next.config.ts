import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@uniframe/db', '@uniframe/ui', '@uniframe/config'],
}

export default nextConfig
