/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['leaflet'],
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ['qfemnpzvhniyzcojbhox.supabase.co']
  }
}

module.exports = nextConfig 