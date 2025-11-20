/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure API routes are not statically optimized
  experimental: {
    dynamicIO: true,
  },
}

module.exports = nextConfig

