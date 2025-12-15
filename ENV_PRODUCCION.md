# Contenido del archivo .env.local para Producción

## 📋 Archivo a crear

Crea un archivo llamado **`.env.local`** en la raíz del proyecto en el servidor de producción.

## 🔐 Contenido completo

```env
# ============================================
# ARCHIVO .env.local PARA PRODUCCIÓN
# ============================================
# 
# INSTRUCCIONES:
# 1. Copia este contenido a .env.local en el servidor
# 2. Reemplaza TODOS los valores marcados con [REEMPLAZAR]
# 3. NUNCA subas .env.local al repositorio
#
# ============================================

# ============================================
# BASE DE DATOS (REQUERIDO) ⚠️
# ============================================
# Formato: postgresql://usuario:contraseña@host:puerto/nombre_base_datos
# Si la BD está en otro servidor, usar SSL agregando ?sslmode=require
DATABASE_URL=postgresql://[USUARIO_BD]:[CONTRASEÑA_BD]@[HOST_BD]:5432/[NOMBRE_BD]

# Ejemplo con SSL (recomendado para producción remota):
# DATABASE_URL=postgresql://cyberpol_user:PasswordSeguro123!@db.servidor.com:5432/cyberpol_prod?sslmode=require

# Ejemplo local (si PostgreSQL está en el mismo servidor):
# DATABASE_URL=postgresql://postgres:MiPasswordSeguro@localhost:5432/cyberpol_prod


# ============================================
# URL PÚBLICA (REQUERIDO PARA QR CODES) ⚠️
# ============================================
# Esta URL se usa en los códigos QR de las denuncias
# Debe ser la URL pública real de tu dominio con HTTPS
NEXT_PUBLIC_URL_BASE=https://[TU-DOMINIO.com]

# Ejemplo:
# NEXT_PUBLIC_URL_BASE=https://denuncias.cyberpol.gov.py


# ============================================
# ENTORNO DE EJECUCIÓN (REQUERIDO) ⚠️
# ============================================
# Siempre usar 'production' en el servidor de producción
NODE_ENV=production


# ============================================
# GOOGLE MAPS API KEY (OPCIONAL)
# ============================================
# Solo necesario si usas mapas en la aplicación
# Obtener en: https://console.cloud.google.com/google/maps-apis
# Si no usas mapas, puedes dejar vacío o comentar esta línea
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[TU_API_KEY_DE_GOOGLE_MAPS]

# Ejemplo:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# ============================================
# PUERTO (OPCIONAL)
# ============================================
# El puerto ya está configurado en package.json como 6368
# Solo cambiar si necesitas usar otro puerto
PORT=6368
```

## 📝 Ejemplo real completo

Aquí tienes un ejemplo con valores reales (reemplaza con los tuyos):

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://cyberpol_user:MiPasswordSeguro2024!@localhost:5432/cyberpol_prod

# URL pública para QR codes
NEXT_PUBLIC_URL_BASE=https://denuncias.cyberpol.gov.py

# Entorno
NODE_ENV=production

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Puerto
PORT=6368
```

## ✅ Variables mínimas requeridas

Para que la aplicación funcione en producción, **mínimo necesitas**:

```env
DATABASE_URL=postgresql://usuario:contraseña@host:5432/nombre_bd
NEXT_PUBLIC_URL_BASE=https://tu-dominio.com
NODE_ENV=production
```

## 🔒 Seguridad

### ⚠️ IMPORTANTE:

1. **NUNCA** compartas este archivo públicamente
2. **NUNCA** lo subas al repositorio (ya está en `.gitignore`)
3. Usa **contraseñas seguras** (mínimo 16 caracteres, mayúsculas, minúsculas, números, símbolos)
4. Cambia las **credenciales por defecto** del usuario 'admin' en la base de datos
5. Usa **HTTPS** en producción (certificado SSL válido)
6. Configura **backups automáticos** de la base de datos
7. Revisa los **permisos del archivo** `.env.local` (debe ser solo lectura para el usuario de la app):
   ```bash
   chmod 600 .env.local
   chown usuario_app:usuario_app .env.local
   ```

## 🚀 Pasos para configurar

1. **En el servidor de producción**, crea el archivo:
   ```bash
   nano .env.local
   # o
   vi .env.local
   ```

2. **Copia el contenido** de arriba y reemplaza los valores

3. **Verifica los permisos**:
   ```bash
   chmod 600 .env.local
   ```

4. **Prueba la conexión** a la base de datos:
   ```bash
   npm run init-db
   ```

5. **Construye la aplicación**:
   ```bash
   npm run build
   ```

6. **Inicia la aplicación**:
   ```bash
   npm start
   # o con PM2:
   pm2 start ecosystem.config.js
   ```

## 📌 Notas adicionales

- **DATABASE_URL**: Si tu base de datos está en otro servidor, agrega `?sslmode=require` al final para usar SSL
- **NEXT_PUBLIC_URL_BASE**: Esta URL debe ser accesible públicamente, ya que se usa en los QR codes de las denuncias
- **NODE_ENV**: Siempre debe ser `production` en el servidor de producción
- **PORT**: Ya está configurado en `package.json` como 6368, solo cambia si necesitas otro puerto

