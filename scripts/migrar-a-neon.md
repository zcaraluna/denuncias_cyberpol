# Guía de Migración a Neon Database

## Paso 1: Crear la base de datos en Neon

1. Ve a https://neon.tech y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto
3. Copia la **Connection String** que te proporciona Neon (formato: `postgresql://usuario:contraseña@host/database?sslmode=require`)

## Paso 2: Exportar datos del VPS actual

Desde tu VPS, ejecuta estos comandos:

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql -d denuncias

# Exportar el schema (estructura de las tablas)
pg_dump -U postgres -d denuncias --schema-only -f /tmp/schema.sql

# Exportar los datos
pg_dump -U postgres -d denuncias --data-only -f /tmp/data.sql

# O exportar todo junto
pg_dump -U postgres -d denuncias -f /tmp/backup_completo.sql
```

## Paso 3: Modificar el backup (opcional)

Si el backup tiene referencias específicas del servidor, puedes limpiarlo:

```bash
# Editar el archivo para remover sentencias específicas del servidor
sed -i 's/OWNER TO postgres;//g' /tmp/backup_completo.sql
sed -i 's/OWNED BY postgres;//g' /tmp/backup_completo.sql
```

## Paso 4: Importar a Neon

### Opción A: Desde el VPS (si tienes acceso a internet)

```bash
# Importar el schema y datos a Neon
PGPASSWORD="tu_contraseña_neon" psql "postgresql://usuario:contraseña@host/database?sslmode=require" -f /tmp/backup_completo.sql
```

### Opción B: Desde tu máquina local

1. Descarga el archivo `backup_completo.sql` del VPS
2. Instala PostgreSQL client en tu máquina (si no lo tienes)
3. Ejecuta:

```bash
psql "postgresql://usuario:contraseña@host.neon.tech/database?sslmode=require" -f backup_completo.sql
```

## Paso 5: Actualizar la configuración

Actualiza la variable `DATABASE_URL` en tu aplicación:

1. En el archivo `.env.local` o `.env`:
```env
DATABASE_URL=postgresql://usuario:contraseña@host.neon.tech/database?sslmode=require
```

2. Si usas Vercel, actualiza la variable de entorno en el dashboard

## Paso 6: Verificar la migración

```bash
# Conectarse a Neon desde tu máquina local
psql "postgresql://usuario:contraseña@host.neon.tech/database?sslmode=require"

# Verificar tablas
\dt

# Verificar conteo de registros
SELECT 'denuncias' as tabla, COUNT(*) FROM denuncias
UNION ALL
SELECT 'denunciantes', COUNT(*) FROM denunciantes
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;
```

