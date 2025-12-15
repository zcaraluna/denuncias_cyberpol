# ✅ Checklist para Producción - CYBERPOL

## 🔐 Seguridad y Configuración

### Variables de Entorno
- [ ] Crear archivo `.env.local` en producción con todas las variables necesarias
- [ ] **Cambiar `NEXTAUTH_SECRET`** por un valor seguro (generar con: `openssl rand -base64 32`)
- [ ] Configurar `DATABASE_URL` con credenciales de producción
- [ ] Configurar `NEXT_PUBLIC_URL_BASE` con la URL pública real del dominio
- [ ] Configurar `NEXTAUTH_URL` con la URL pública real
- [ ] Configurar `NODE_ENV=production`
- [ ] (Opcional) Configurar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` si se usan mapas

### Base de Datos
- [ ] Crear base de datos PostgreSQL en producción
- [ ] Ejecutar `npm run init-db` para crear las tablas
- [ ] Verificar que todas las migraciones estén aplicadas
- [ ] Configurar backups automáticos de la base de datos
- [ ] Cambiar la contraseña del usuario `admin` por defecto
- [ ] Crear usuarios de producción con roles apropiados

### Seguridad
- [ ] Cambiar credenciales por defecto (`admin`/`admin123`)
- [ ] Configurar SSL/TLS para la base de datos (si es remota)
- [ ] Configurar HTTPS en el servidor web (Nginx/Apache)
- [ ] Revisar permisos de archivos (`.env.local` no debe ser accesible públicamente)
- [ ] Configurar firewall del servidor
- [ ] Revisar y actualizar dependencias (`npm audit`)
- [ ] Configurar rate limiting en las APIs si es necesario

## 🚀 Despliegue

### Servidor
- [ ] Instalar Node.js 18+ en el servidor
- [ ] Instalar PostgreSQL 12+ en el servidor
- [ ] Clonar el repositorio en el servidor
- [ ] Instalar dependencias: `npm install`
- [ ] Construir la aplicación: `npm run build`
- [ ] Configurar proceso manager (PM2/systemd)

### Proxy Reverso (Nginx/Apache)
- [ ] Configurar proxy reverso apuntando al puerto 6368
- [ ] Configurar SSL/HTTPS con certificado válido
- [ ] Configurar headers de seguridad
- [ ] Configurar compresión gzip
- [ ] Configurar cache para assets estáticos

### Monitoreo y Logs
- [ ] Configurar logs de aplicación (PM2 logs o systemd journal)
- [ ] Configurar monitoreo de errores (opcional: Sentry, LogRocket, etc.)
- [ ] Configurar alertas de caídas del servicio
- [ ] Configurar monitoreo de uso de recursos (CPU, memoria, disco)

## 📋 Funcionalidades a Verificar

### Autenticación
- [ ] Login funciona correctamente
- [ ] Sesiones se mantienen correctamente
- [ ] Logout funciona
- [ ] Protección de rutas funciona

### Formularios
- [ ] Formulario de nueva denuncia funciona en todos los pasos
- [ ] Validaciones funcionan correctamente
- [ ] Guardado de borradores funciona
- [ ] Carga de borradores funciona

### PDFs
- [ ] Generación de PDFs funciona
- [ ] QR codes se generan correctamente
- [ ] URLs de verificación funcionan
- [ ] Descarga de PDFs funciona

### Reportes
- [ ] Exportación a Excel funciona
- [ ] Exportación a CSV funciona
- [ ] Filtros de reportes funcionan
- [ ] Gráficos se muestran correctamente

### Base de Datos
- [ ] Todas las operaciones CRUD funcionan
- [ ] Búsquedas funcionan correctamente
- [ ] Relaciones entre tablas funcionan

## 🔧 Configuración Adicional

### Performance
- [ ] Verificar que la compilación de producción funciona sin errores
- [ ] Optimizar imágenes (si hay)
- [ ] Configurar cache de Next.js
- [ ] Verificar tiempos de carga

### Compatibilidad
- [ ] Probar en diferentes navegadores (Chrome, Firefox, Safari, Edge)
- [ ] Probar en dispositivos móviles
- [ ] Verificar responsive design

### Documentación
- [ ] Documentar credenciales de acceso (guardar de forma segura)
- [ ] Documentar configuración del servidor
- [ ] Documentar procedimientos de backup/restore
- [ ] Documentar procedimientos de actualización

## 📝 Notas Importantes

1. **Nunca** subir el archivo `.env.local` al repositorio
2. **Siempre** usar HTTPS en producción
3. **Cambiar** todas las credenciales por defecto
4. **Configurar** backups regulares de la base de datos
5. **Monitorear** el uso de recursos del servidor
6. **Mantener** las dependencias actualizadas regularmente

## 🆘 En Caso de Problemas

1. Revisar logs de la aplicación
2. Revisar logs de PostgreSQL
3. Verificar variables de entorno
4. Verificar conectividad a la base de datos
5. Verificar que el puerto 6368 esté disponible
6. Verificar permisos de archivos y directorios

