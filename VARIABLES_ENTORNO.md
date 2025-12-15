# Variables de Entorno - CYBERPOL

## Archivo de Configuración

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos PostgreSQL
# Formato: postgresql://usuario:contraseña@host:puerto/nombre_base_datos
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/cyberpol_db

# URL base de la aplicación (para desarrollo)
# En producción, usar la URL real del dominio
NEXTAUTH_URL=http://localhost:3000

# Secret para NextAuth (generar con: openssl rand -base64 32)
# IMPORTANTE: Cambiar en producción por un valor seguro y único
NEXTAUTH_SECRET=secret-temporal-para-desarrollo-cambiar-en-produccion

# URL base para verificación pública de denuncias (usado en QR codes)
# En producción, usar la URL pública del dominio
NEXT_PUBLIC_URL_BASE=https://tu-dominio.com

# Google Maps API Key (opcional - solo si quieres usar mapas)
# Obtener en: https://console.cloud.google.com/google/maps-apis
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Entorno de ejecución
# development | production
NODE_ENV=development

# Puerto de la aplicación (opcional, por defecto Next.js usa 3000)
PORT=6368
```

## Descripción de Variables

### DATABASE_URL (Requerido)
- **Descripción**: Cadena de conexión a PostgreSQL
- **Formato**: `postgresql://usuario:contraseña@host:puerto/nombre_base_datos`
- **Ejemplo**: `postgresql://postgres:mipassword@localhost:5432/cyberpol_db`
- **Producción**: Usar credenciales seguras y considerar SSL

### NEXTAUTH_URL (Opcional)
- **Descripción**: URL base de la aplicación
- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://tu-dominio.com`

### NEXTAUTH_SECRET (Recomendado)
- **Descripción**: Secret para firmar tokens de sesión
- **Generar**: `openssl rand -base64 32`
- **Importante**: Cambiar en producción

### NEXT_PUBLIC_URL_BASE (Recomendado)
- **Descripción**: URL pública para verificación de denuncias (usado en QR codes)
- **Valor por defecto**: `https://neo.s1mple.cloud`
- **Producción**: Usar la URL pública real del dominio

### NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Opcional)
- **Descripción**: API Key de Google Maps para usar mapas
- **Obtener**: https://console.cloud.google.com/google/maps-apis
- **Nota**: Solo necesario si se usan mapas en la aplicación

### NODE_ENV (Opcional)
- **Descripción**: Entorno de ejecución
- **Valores**: `development` | `production`
- **Por defecto**: `development` en dev, `production` en build

### PORT (Opcional)
- **Descripción**: Puerto donde corre la aplicación
- **Por defecto**: 3000 (dev) o 6368 (producción según package.json)
- **Nota**: Ya está configurado en `package.json` para producción

## Configuración para Producción

1. **Generar NEXTAUTH_SECRET seguro**:
   ```bash
   openssl rand -base64 32
   ```

2. **Configurar DATABASE_URL con SSL** (si la BD es remota):
   ```
   DATABASE_URL=postgresql://usuario:contraseña@host:puerto/db?sslmode=require
   ```

3. **Configurar URLs públicas**:
   ```
   NEXTAUTH_URL=https://tu-dominio.com
   NEXT_PUBLIC_URL_BASE=https://tu-dominio.com
   ```

4. **Configurar entorno**:
   ```
   NODE_ENV=production
   ```

## Seguridad

⚠️ **IMPORTANTE**:
- Nunca subir `.env.local` al repositorio (ya está en `.gitignore`)
- Usar credenciales seguras en producción
- Cambiar todas las contraseñas por defecto
- Usar HTTPS en producción
- Considerar usar un gestor de secretos (AWS Secrets Manager, HashiCorp Vault, etc.) en producción

