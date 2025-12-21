# Cambios Necesarios en el VPS después de Eliminar VPN

## 📋 Resumen

Después de eliminar toda la funcionalidad VPN del código, necesitas hacer algunos cambios en el servidor VPS para que la aplicación funcione correctamente.

## ✅ Cambios Requeridos

### 1. Actualizar Variables de Entorno (.env.local)

**Ubicación:** `/ruta/del/proyecto/.env.local`

**Eliminar o comentar estas líneas:**

```env
# ============================================
# VERIFICACIÓN VPN (YA NO SE NECESITA)
# ============================================
# VPN_REQUIRED=true                    # ← ELIMINAR o cambiar a false
# VPN_RANGE=10.8.0.0/24                # ← ELIMINAR
# VPN_REQUIRED_DOMAINS=...             # ← ELIMINAR
# VPN_API_URL=http://127.0.0.1:6368   # ← ELIMINAR
```

**O simplemente eliminar toda la sección de VPN.**

**Ejemplo de .env.local actualizado:**

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_bd

# URL pública para QR codes
NEXT_PUBLIC_URL_BASE=https://tu-dominio.com

# Entorno
NODE_ENV=production

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key

# Puerto
PORT=6368
```

### 2. Reiniciar la Aplicación

Después de cambiar las variables de entorno, **reinicia la aplicación** para que los cambios surtan efecto:

**Si usas PM2:**
```bash
pm2 restart cyberpol-denuncias
# o
pm2 restart all
```

**Si usas systemd:**
```bash
sudo systemctl restart cyberpol
```

**Si ejecutas directamente:**
```bash
# Detener el proceso actual (Ctrl+C) y luego:
npm start
```

### 3. Verificar que la Aplicación Funciona

1. **Accede a la aplicación** desde el navegador
2. **Intenta hacer login** - debería funcionar sin verificar VPN
3. **Revisa los logs** para asegurarte de que no hay errores relacionados con VPN

**Ver logs con PM2:**
```bash
pm2 logs cyberpol-denuncias
```

**Ver logs con systemd:**
```bash
sudo journalctl -u cyberpol -f
```

## 🔧 Cambios Opcionales (si ya no usas VPN)

### Opción A: Mantener OpenVPN pero no usarlo

Si quieres mantener OpenVPN instalado pero no usarlo para esta aplicación, **no necesitas hacer nada más**. Solo asegúrate de que las variables de entorno estén eliminadas.

### Opción B: Detener/Deshabilitar OpenVPN

Si ya no necesitas OpenVPN para nada, puedes detenerlo:

**Detener el servicio:**
```bash
sudo systemctl stop openvpn
# o si tienes múltiples instancias:
sudo systemctl stop openvpn@server
```

**Deshabilitar para que no inicie al arrancar:**
```bash
sudo systemctl disable openvpn
# o
sudo systemctl disable openvpn@server
```

**Verificar estado:**
```bash
sudo systemctl status openvpn
```

### Opción C: Desinstalar OpenVPN (solo si no lo necesitas)

**⚠️ ADVERTENCIA:** Solo haz esto si estás 100% seguro de que no necesitas OpenVPN para nada más.

```bash
# En Ubuntu/Debian:
sudo apt remove openvpn
sudo apt autoremove

# En CentOS/RHEL:
sudo yum remove openvpn
```

## 📝 Verificación Final

Después de hacer los cambios, verifica:

1. ✅ La aplicación inicia sin errores
2. ✅ Puedes hacer login sin problemas
3. ✅ No aparecen errores relacionados con VPN en los logs
4. ✅ La aplicación es accesible desde cualquier IP (no solo desde VPN)

## 🐛 Solución de Problemas

### Error: "Cannot find module '@/lib/vpn-utils'"

**Solución:** Asegúrate de haber hecho `git pull` o actualizado el código en el servidor para obtener los cambios que eliminan las referencias a VPN.

### La aplicación sigue verificando VPN

**Solución:** 
1. Verifica que eliminaste las variables `VPN_REQUIRED=true` del `.env.local`
2. Reinicia la aplicación completamente
3. Limpia el caché de Next.js: `rm -rf .next`

### Error al iniciar la aplicación

**Solución:**
1. Revisa los logs: `pm2 logs` o `journalctl -u cyberpol`
2. Verifica que todas las variables de entorno requeridas estén configuradas (DATABASE_URL, NEXT_PUBLIC_URL_BASE, etc.)
3. Asegúrate de que el código esté actualizado: `git pull` o sube los archivos actualizados

## 📌 Notas Importantes

- **No necesitas cambiar Nginx** - El proxy reverso seguirá funcionando igual
- **No necesitas cambiar el firewall** - Los puertos siguen siendo los mismos
- **La base de datos no cambia** - Todo sigue igual
- **Solo cambias las variables de entorno** y reinicias la aplicación

## ✅ Checklist

- [ ] Eliminé/comenté las variables VPN del `.env.local`
- [ ] Reinicié la aplicación (PM2/systemd/npm)
- [ ] Verifiqué que la aplicación funciona correctamente
- [ ] Verifiqué que puedo hacer login sin problemas
- [ ] Revisé los logs y no hay errores relacionados con VPN
- [ ] (Opcional) Detuve/deshabilité OpenVPN si ya no lo necesito


