# Instrucciones para Probar en Local

## Paso 1: Instalar PostgreSQL (si no lo tienes)

### Windows:
1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. O usa el instalador gráfico: https://www.postgresql.org/download/windows/
3. Durante la instalación, anota la contraseña del usuario `postgres`

### macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Paso 2: Crear la Base de Datos

Abre una terminal y ejecuta:

```bash
# Conectar a PostgreSQL (puede pedirte la contraseña)
psql -U postgres

# En el prompt de PostgreSQL, ejecuta:
CREATE DATABASE cyberpol_db;

# Salir de PostgreSQL
\q
```

## Paso 3: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos PostgreSQL
# AJUSTA estos valores según tu instalación:
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/cyberpol_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=secret-temporal-para-desarrollo-cambiar-en-produccion

# Google Maps API (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**Importante:** Reemplaza `TU_CONTRASEÑA` con la contraseña que configuraste para PostgreSQL.

## Paso 4: Inicializar la Base de Datos

```bash
npm run init-db
```

Este comando creará todas las tablas y un usuario de prueba:
- Usuario: `admin`
- Contraseña: `admin123`

## Paso 5: Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## Paso 6: Probar el Login

1. Abre http://localhost:3000 en tu navegador
2. Ingresa:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Serás redirigido al dashboard

## Solución de Problemas

### Error: "No se pudo conectar a la base de datos"
- Verifica que PostgreSQL esté ejecutándose
- Confirma que la contraseña en `.env.local` sea correcta
- Verifica que la base de datos `cyberpol_db` exista

### Error: "Puerto 3000 ya en uso"
- Cambia el puerto: `PORT=3001 npm run dev`
- O detén el proceso que usa el puerto 3000

### Error al ejecutar `npm run init-db`
- Asegúrate de tener `bcryptjs` instalado (ya viene en las dependencias)
- Verifica que la conexión a PostgreSQL funcione manualmente

