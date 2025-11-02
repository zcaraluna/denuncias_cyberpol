module.exports = {
  apps: [
    {
      name: 'cyberpol-denuncias',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/cyberpol',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 6368,
      },
      error_file: '/var/log/cyberpol/error.log',
      out_file: '/var/log/cyberpol/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
