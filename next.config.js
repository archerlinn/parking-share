/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['leaflet'],
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig 