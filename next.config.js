/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return `${Date.now()}`
  },
}

module.exports = nextConfig
