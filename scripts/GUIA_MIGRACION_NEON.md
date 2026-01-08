# Guía de Migración: VPS a Neon Database

Esta guía te ayudará a migrar tu base de datos PostgreSQL desde el VPS a Neon Database paso a paso.

## Prerrequisitos

- Acceso SSH al VPS
- Cuenta de Neon Database creada (https://neon.tech)
- Connection string de Neon Database
- Acceso a la consola de Neon (SQL Editor)

## Paso 1: Exportar la Base de Datos desde el VPS

### 1.1 Conectarse al VPS via SSH

```bash
ssh usuario@tu_vps_ip
```

### 1.2 Exportar la base de datos

Ejecuta el siguiente comando en el VPS:

```bash
# Cambiar al usuario postgres (si es necesario usar sudo)
sudo -u postgres pg_dump -d denuncias --clean --if-exists --no-owner --no-acl -f /tmp/backup_neon_$(date +%Y%m%d_%H%M%S).sql
```

O si estás conectado como el usuario que tiene acceso directo:

```bash
pg_dump -U postgres -d denuncias --clean --if-exists --no-owner --no-acl -f /tmp/backup_neon.sql
```

**Parámetros explicados:**
- `--clean`: Incluye comandos DROP antes de CREATE
- `--if-exists`: Usa IF EXISTS en los DROP (más seguro)
- `--no-owner`: No incluye comandos de ownership (Neon asigna su propio owner)
- `--no-acl`: No incluye permisos (Neon maneja sus propios permisos)

### 1.3 Verificar el archivo exportado

```bash
ls -lh /tmp/backup_neon*.sql
```

## Paso 2: Descargar el Backup a tu Computadora Local

### Opción A: Usando SCP

Desde tu computadora local (fuera del VPS):

```bash
scp usuario@tu_vps_ip:/tmp/backup_neon.sql ./backup_neon.sql
```

### Opción B: Usando MobaXterm

1. Conecta con MobaXterm al VPS
2. Navega a `/tmp`
3. Encuentra el archivo `backup_neon.sql`
4. Haz clic derecho → Download

## Paso 3: Limpiar el Archivo SQL (Opcional pero Recomendado)

El archivo puede contener comandos `\restrict` y `\unrestrict` que Neon no acepta.

### 3.1 Abrir el archivo en un editor de texto

### 3.2 Buscar y eliminar las líneas que contengan:

```
\restrict
```

y

```
\unrestrict
```

O usa sed (en Linux/Mac) o PowerShell (en Windows):

**Linux/Mac:**
```bash
sed '/^\\restrict$/d; /^\\unrestrict$/d' backup_neon.sql > backup_neon_limpio.sql
```

**Windows PowerShell:**
```powershell
Get-Content backup_neon.sql | Where-Object { $_ -notmatch '^\\restrict$' -and $_ -notmatch '^\\unrestrict$' } | Set-Content backup_neon_limpio.sql
```

## Paso 4: Limpiar la Base de Datos en Neon

### 4.1 Acceder al SQL Editor de Neon

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Haz clic en "SQL Editor"

### 4.2 Ejecutar el siguiente SQL para limpiar

```sql
-- Eliminar todo el contenido del schema public
DROP SCHEMA public CASCADE;

-- Recrear el schema public
CREATE SCHEMA public;

-- Otorgar permisos
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Paso 5: Importar el Backup a Neon

### Opción A: Usando psql desde tu computadora

**Instalar psql si no lo tienes:**

**Windows (MobaXterm):**
```bash
apt install postgresql-client
```

**Linux:**
```bash
sudo apt install postgresql-client
```

**Mac:**
```bash
brew install postgresql
```

**Importar:**
```bash
psql "TU_CONNECTION_STRING_DE_NEON" -f backup_neon_limpio.sql
```

Reemplaza `TU_CONNECTION_STRING_DE_NEON` con tu connection string, ejemplo:
```
postgresql://usuario:password@host.neon.tech/database?sslmode=require
```

### Opción B: Usando el SQL Editor de Neon

1. Abre el archivo `backup_neon_limpio.sql` en tu editor de texto
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Neon
4. Haz clic en "Run"

**Nota:** Si el archivo es muy grande (>1MB), usa la Opción A.

## Paso 6: Verificar la Importación

### 6.1 Verificar tablas creadas

En el SQL Editor de Neon, ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 6.2 Verificar conteo de registros

```sql
SELECT 
    'denuncias' as tabla, 
    COUNT(*) as registros 
FROM denuncias
UNION ALL
SELECT 'denunciantes', COUNT(*) FROM denunciantes
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'supuestos_autores', COUNT(*) FROM supuestos_autores
UNION ALL
SELECT 'denuncias_involucrados', COUNT(*) FROM denuncias_involucrados
ORDER BY tabla;
```

### 6.3 Verificar algunas denuncias

```sql
SELECT 
    d.id,
    d.orden,
    d.fecha_denuncia,
    d.tipo_denuncia,
    den.nombres as nombre_denunciante
FROM denuncias d
JOIN denunciantes den ON d.denunciante_id = den.id
ORDER BY d.fecha_denuncia DESC
LIMIT 5;
```

## Paso 7: Actualizar la Aplicación en Vercel

### 7.1 Obtener el Connection String de Neon

1. En la consola de Neon, ve a "Connection Details"
2. Copia el "Connection string" (formato: `postgresql://...`)

### 7.2 Actualizar Variable de Entorno en Vercel

1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Busca `DATABASE_URL`
5. Haz clic en **Edit**
6. Pega el nuevo connection string de Neon
7. Haz clic en **Save**

### 7.3 Redesplegar la Aplicación

1. Ve a **Deployments**
2. Encuentra el último deployment
3. Haz clic en los tres puntos (⋯) → **Redeploy**
4. Espera a que termine el deployment

## Paso 8: Verificar que Todo Funciona

1. Accede a tu aplicación desplegada
2. Intenta iniciar sesión
3. Verifica que puedes ver las denuncias existentes
4. Crea una nueva denuncia de prueba
5. Verifica que se guarda correctamente

## Solución de Problemas

### Error: "relation does not exist"

**Causa:** La importación no se completó correctamente.

**Solución:**
1. Verifica que todas las tablas se crearon (Paso 6.1)
2. Re-importa el backup si es necesario
3. Verifica que no haya errores en la consola de Neon

### Error: "connection refused" o "timeout"

**Causa:** El connection string es incorrecto o la base de datos está pausada.

**Solución:**
1. Verifica el connection string en Vercel
2. Asegúrate de que la base de datos en Neon no esté pausada
3. Verifica que `sslmode=require` esté en el connection string

### Error: "invalid input syntax for type date"

**Causa:** Problemas con formato de fechas.

**Solución:**
- Este error generalmente se resuelve automáticamente si usaste el backup correcto
- Verifica que las fechas en la BD tengan el formato correcto

### La aplicación sigue usando la BD antigua

**Causa:** Vercel no ha aplicado los cambios o el redeploy no se completó.

**Solución:**
1. Verifica que `DATABASE_URL` en Vercel tenga el connection string de Neon
2. Haz un redeploy completo
3. Espera unos minutos para que los cambios se propaguen

## Checklist Final

- [ ] Backup exportado desde VPS
- [ ] Backup descargado a computadora local
- [ ] Archivo SQL limpiado (eliminados \restrict y \unrestrict)
- [ ] Base de datos en Neon limpiada
- [ ] Backup importado a Neon
- [ ] Tablas verificadas en Neon
- [ ] Registros verificados (conteo correcto)
- [ ] DATABASE_URL actualizada en Vercel
- [ ] Aplicación redesplegada en Vercel
- [ ] Aplicación funcionando correctamente

## Notas Importantes

1. **Backup del VPS:** Guarda el backup del VPS en un lugar seguro antes de desactivarlo
2. **Connection String:** Mantén el connection string de Neon seguro y privado
3. **Mantenimiento:** Neon puede pausar bases de datos inactivas en el plan gratuito
4. **Performance:** El plan gratuito de Neon tiene límites, considera actualizar si es necesario

## Contacto y Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs en la consola de Neon
2. Revisa los logs en Vercel
3. Verifica que todos los pasos se completaron correctamente




