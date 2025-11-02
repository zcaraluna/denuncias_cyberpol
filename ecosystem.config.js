module.exports = {
  apps: [
    {
      name: 'cyberpol-denuncias',
      script: 'npm',
      args: 'start',
      cwd: '/home/bitcanc/web/neo.s1mple.cloud/public_html',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 6368,
      },
      error_file: '/home/bitcanc/web/neo.s1mple.cloud/public_html/logs/error.log',
      out_file: '/home/bitcanc/web/neo.s1mple.cloud/public_html/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
