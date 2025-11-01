# 🚀 Cómo Probar en Local - Guía Rápida

## Pasos Rápidos

### 1. Verificar que PostgreSQL esté instalado y corriendo

```bash
# Windows (PowerShell)
Get-Service postgresql*

# macOS/Linux
sudo systemctl status postgresql
```

Si no está instalado, sigue las instrucciones en `INSTRUCCIONES_LOCAL.md`

### 2. Crear la base de datos

Abre PowerShell o Terminal y ejecuta:

```bash
# Conectar a PostgreSQL
psql -U postgres

# En el prompt, crear la base de datos:
CREATE DATABASE cyberpol_db;
\q
```

### 3. Crear archivo `.env.local`

Crea un archivo llamado `.env.local` en la raíz del proyecto con:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/cyberpol_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=mi-secret-temp-123456
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**⚠️ IMPORTANTE:** Cambia `TU_CONTRASEÑA` por la contraseña de PostgreSQL que configuraste.

### 4. Inicializar la base de datos

```bash
npm run init-db
```

Esto creará:
- ✅ Todas las tablas necesarias
- ✅ Usuario de prueba: `admin` / `admin123`

### 5. Iniciar la aplicación

```bash
npm run dev
```

### 6. Abrir en el navegador

Ve a: **http://localhost:3000**

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## 🐛 Problemas Comunes

### Error: "No se pudo conectar a la base de datos"
- ✅ Verifica que PostgreSQL esté ejecutándose
- ✅ Revisa la contraseña en `.env.local`
- ✅ Confirma que la base `cyberpol_db` existe

### Error: "Puerto 3000 ya en uso"
```bash
PORT=3001 npm run dev
```

### No puedo conectarme a PostgreSQL
```bash
# Verificar que el servicio esté corriendo
# Windows
Get-Service postgresql*

# Reiniciar si es necesario
Restart-Service postgresql*
```

---

## ✅ Checklist Rápido

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `cyberpol_db` creada
- [ ] Archivo `.env.local` configurado con la contraseña correcta
- [ ] `npm install` ejecutado
- [ ] `npm run init-db` ejecutado sin errores
- [ ] `npm run dev` ejecutado
- [ ] Navegador abierto en http://localhost:3000
- [ ] Login exitoso con admin/admin123

