# Guía de Despliegue

## Configuración del Puerto

La aplicación está configurada para ejecutarse en el puerto **6368**.

## Pasos para desplegar en VPS

1. Clonar el repositorio:
```bash
git clone <tu-repositorio> /var/www/cyberpol
cd /var/www/cyberpol
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de base de datos
```

4. Inicializar la base de datos:
```bash
npm run init-db
```

5. Crear directorio para logs (si usas PM2):
```bash
sudo mkdir -p /var/log/cyberpol
sudo chown $USER:$USER /var/log/cyberpol
```

6. Construir la aplicación:
```bash
npm run build
```

7. Iniciar la aplicación:

### Opción A: Con PM2 (recomendado)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir las instrucciones para iniciar PM2 al arranque del sistema
```

### Opción B: Con npm directamente
```bash
npm start
```

### Opción C: Con systemd
Crear archivo `/etc/systemd/system/cyberpol.service`:
```ini
[Unit]
Description=CyberPOL Denuncias App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/cyberpol
Environment=NODE_ENV=production
Environment=PORT=6368
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Luego:
```bash
sudo systemctl daemon-reload
sudo systemctl start cyberpol
sudo systemctl enable cyberpol
```

## Configuración de Nginx (opcional)

Si quieres usar Nginx como proxy reverso, configuración de ejemplo:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:6368;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Verificar que funciona

```bash
curl http://localhost:6368
```

## Comandos útiles PM2

```bash
pm2 status              # Ver estado
pm2 logs cyberpol       # Ver logs
pm2 restart cyberpol    # Reiniciar
pm2 stop cyberpol       # Detener
pm2 delete cyberpol     # Eliminar de PM2
```

## Comandos útiles systemd

```bash
sudo systemctl status cyberpol    # Ver estado
sudo journalctl -u cyberpol -f    # Ver logs en tiempo real
sudo systemctl restart cyberpol   # Reiniciar
sudo systemctl stop cyberpol      # Detener
```

