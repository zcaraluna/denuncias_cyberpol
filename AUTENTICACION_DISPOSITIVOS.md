# Sistema de Autenticación de Dispositivos

## Descripción

Este sistema permite autorizar computadoras/dispositivos para acceder a la aplicación mediante códigos de un solo uso. Una vez autorizado un dispositivo, los usuarios pueden hacer login normalmente.

## Flujo de Autenticación

1. **Dispositivo nuevo**: Cuando un usuario intenta acceder a la aplicación desde un dispositivo no autorizado, es redirigido automáticamente a `/autenticar`.

2. **Autorización**: El desarrollador genera un código de activación único y se lo proporciona al usuario.

3. **Ingreso del código**: El usuario ingresa el código en la página `/autenticar`.

4. **Registro**: El sistema valida el código, lo marca como usado y registra el dispositivo como autorizado.

5. **Acceso libre**: A partir de ese momento, cualquier usuario con credenciales válidas puede usar ese dispositivo para acceder al sistema.

## Componentes Implementados

### 1. Base de Datos

**Migración**: `scripts/migrations/008_add_dispositivos_autorizados.sql`

- **Tabla `codigos_activacion`**: Almacena los códigos de un solo uso
- **Tabla `dispositivos_autorizados`**: Almacena los dispositivos autorizados con su fingerprint

### 2. API Routes

- **`/api/autenticar`**: Valida códigos de activación y registra dispositivos
- **`/api/verificar-dispositivo`**: Verifica si un dispositivo está autorizado

### 3. Páginas

- **`/autenticar`**: Página para ingresar el código de activación

### 4. Middleware

- **`middleware.ts`**: Verifica que el dispositivo tenga la cookie `device_fingerprint` antes de permitir acceso (excepto rutas públicas)

### 5. Funciones Helper

En `lib/auth.ts`:
- `generarFingerprint(userAgent)`: Genera un identificador único del dispositivo
- `validarCodigoActivacion()`: Valida un código y registra el dispositivo
- `verificarDispositivoAutorizado()`: Verifica si un dispositivo está autorizado
- `generarCodigoActivacion()`: Genera nuevos códigos (usado internamente)

### 6. Script de Generación

- **`scripts/generar-codigo-activacion.js`**: Script para generar códigos de activación

## Uso

### Paso 1: Ejecutar la Migración

```bash
node scripts/run-migration.js 008_add_dispositivos_autorizados.sql
```

### Paso 2: Generar un Código de Activación

```bash
# Generar código con expiración de 30 días (por defecto)
node scripts/generar-codigo-activacion.js

# Generar código con expiración personalizada (ej: 7 días)
node scripts/generar-codigo-activacion.js 7
```

El script mostrará el código generado. **Guárdalo de forma segura**, ya que solo puede usarse una vez.

### Paso 3: Proporcionar el Código al Usuario

Comparte el código con la persona que necesita autorizar su dispositivo. El código puede ingresarse con o sin guiones.

### Paso 4: Usuario Ingresa el Código

1. El usuario accede a la aplicación
2. Es redirigido automáticamente a `/autenticar`
3. Ingresa el código proporcionado
4. Si el código es válido, el dispositivo queda autorizado
5. El usuario puede ahora hacer login normalmente

## Seguridad

### Características de Seguridad

- ✅ Códigos de un solo uso (no reutilizables)
- ✅ Expiración configurable
- ✅ Fingerprint único por dispositivo basado en User-Agent
- ✅ Validación en servidor (no se puede falsificar fácilmente)
- ✅ Registro de IP y User-Agent del dispositivo
- ✅ Cookies con SameSite=Strict para protección CSRF

### Limitaciones

- El fingerprint se basa solo en User-Agent, por lo que:
  - El mismo navegador en diferentes computadoras tendrá diferentes fingerprints
  - Diferentes navegadores en la misma computadora tendrán diferentes fingerprints
  - Si el usuario cambia su User-Agent, necesitará un nuevo código

### Recomendaciones

1. **Generar códigos según necesidad**: Solo generar códigos cuando sea necesario autorizar un dispositivo específico
2. **Expiración corta**: Usar períodos de expiración razonables (7-30 días)
3. **Comunicación segura**: Compartir códigos por canales seguros (no por email sin cifrar, etc.)
4. **Revocación**: Si un código se compromete, puedes desactivar el dispositivo desde la base de datos

## Gestión de Dispositivos

### Ver dispositivos autorizados

```sql
SELECT 
    id,
    fingerprint,
    user_agent,
    ip_address,
    autorizado_en,
    ultimo_acceso,
    activo
FROM dispositivos_autorizados
ORDER BY autorizado_en DESC;
```

### Desactivar un dispositivo

```sql
UPDATE dispositivos_autorizados 
SET activo = FALSE 
WHERE id = <id_dispositivo>;
```

### Ver códigos usados

```sql
SELECT 
    id,
    codigo,
    usado,
    usado_en,
    dispositivo_fingerprint,
    creado_en,
    expira_en
FROM codigos_activacion
ORDER BY creado_en DESC;
```

## Ejemplo de Flujo Completo

1. **Desarrollador genera código**:
   ```bash
   $ node scripts/generar-codigo-activacion.js
   ✅ ¡Código de activación generado exitosamente!
   
   📋 Detalles del código:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Código:        ABCD-1234-EFGH-5678-...
   ```

2. **Usuario accede a la aplicación**:
   - Navega a `https://tuapp.com`
   - Es redirigido a `https://tuapp.com/autenticar`

3. **Usuario ingresa código**:
   - Ingresa el código: `ABCD-1234-EFGH-5678-...`
   - Sistema valida y autoriza el dispositivo

4. **Usuario hace login**:
   - Ahora puede acceder a `https://tuapp.com` normalmente
   - Ingresa usuario y contraseña
   - Accede al sistema

## Notas Técnicas

- El fingerprint se almacena en una cookie `device_fingerprint`
- También se guarda en `localStorage` como respaldo
- El middleware verifica la existencia de la cookie antes de permitir acceso
- La validación real contra la base de datos se hace en las rutas API protegidas
- Los códigos se almacenan sin guiones en la BD pero se muestran con guiones para mejor legibilidad

