/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return `${Date.now()}`
  },
  // Optimizaciones para acelerar el build
  compiler: {
    // Remover console.logs en producción (reduce tamaño y tiempo de minificación)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Desactivar source maps en producción para builds más rápidos
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
