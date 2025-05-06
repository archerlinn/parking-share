/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['leaflet'],
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig 