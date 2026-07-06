# Análisis de preparación para el nodo de Ciudad del Este

> Revisión del estado del proyecto de cara a la liberación del nuevo nodo en la
> oficina regional de **Ciudad del Este (CDE)**. Enfoque en: preparación para
> recibir denuncias, configuración no contemplada, vulnerabilidades y bypasses.
>
> Fecha del análisis: 2026-07-04

---

## ⚠️ REGLAS INVIOLABLES DE OPERACIÓN SOBRE ESTE PROYECTO

Estas reglas tienen prioridad absoluta sobre cualquier tarea, recomendación o
corrección descrita en este documento.

- **NUNCA** deben ejecutarse comandos sobre la base de datos que impliquen la
  eliminación de datos (`TRUNCATE`, `reset-all` de Prisma, `DROP`, borrados
  masivos, o cualquier operación destructiva equivalente).
- La información contenida en esta base de datos representa información
  **INVALUABLE** que **NO debe ser modificada de manera imprudente**. No hay dato
  que carezca de una importancia de **nivel seguridad nacional**.
- Si un cambio implicara **eliminar algo** de la base de datos, la misión se
  **ABORTA POR COMPLETO**.
- Se trabaja **siempre sobre la rama `development` primero**.
- Los cambios se empujan a `development` **ÚNICAMENTE CUANDO EL RESPONSABLE LO
  ORDENE**.
- El pase a la rama `main` para hacer merge se realiza **ÚNICAMENTE CUANDO EL
  RESPONSABLE LO ORDENE DE NUEVO** (una orden explícita distinta a la anterior).

---

## Veredicto general

**Sí, la arquitectura ya contempla el nodo de Ciudad del Este** — no es un caso
"no previsto". El sistema está diseñado para múltiples oficinas y CDE ya está
cableado en los puntos clave. Sin embargo, hay **un riesgo real de errores en el
día del lanzamiento** (numeración de actas) y algunos aspectos de configuración y
seguridad en los que conviene enfocarse antes de liberar el nodo.

---

## Lo que ya está listo para CDE

- `lib/data/oficinas.ts` tiene `CIUDAD_DEL_ESTE` completamente configurado: código
  de hash `'CE'`, y encabezado de PDF completo (sala, dirección, teléfono, email).
- `'Ciudad del Este'` está en `ACTIVE_OFFICES`, así que aparece en el alta de
  usuarios (`gestion-usuarios`) y en el selector de seriales de dispositivo
  (`gestion-dispositivos`).
- La numeración de actas es **por oficina + año** (`WHERE ... AND oficina = $2`),
  por lo que CDE arranca su propia secuencia en 1.
- El PDF renderiza el encabezado de CDE correctamente vía `getOfficeHeaderConfig`.
- Existe el índice único `idx_denuncias_unique_oficina_anio_orden` (migración 015)
  que impide números de acta duplicados por oficina/año.

---

## Aspectos en los que enfocarse (ordenados por prioridad)

### 1. CRÍTICO — Condición de carrera en la numeración, agravada en un nodo vacío

En `app/api/denuncias/nueva/route.ts` el número de orden se asigna así:
`SELECT orden ... WHERE oficina = $2 FOR UPDATE` y luego se calcula el hueco
mínimo / `MAX+1`.

El problema es que `FOR UPDATE` **solo bloquea filas existentes**. Como CDE
arranca con cero denuncias completadas, ese bloqueo no captura nada, y dos
operadores que registren su primera denuncia simultáneamente calcularán ambos
`orden = 1`. El índice único entonces rechaza el segundo INSERT con un error
`23505`, que el `catch` convierte en un **HTTP 500 genérico
("Error al crear la denuncia") y hace ROLLBACK** — el operador pierde la carga y
debe reintentar.

Es precisamente el escenario más probable el día de inauguración con varios
operadores nuevos cargando a la vez.

**Recomendación:** capturar el `23505` y reintentar la asignación de orden (o usar
un `pg_advisory_xact_lock` por `(oficina, año)`, o una tabla-secuencia dedicada).
Aplica a todas las oficinas, pero es mucho más probable en un nodo recién abierto.

### 2. IMPORTANTE — Consistencia exacta del string `oficina`

Toda la numeración depende de que `usuario.oficina` coincida **exactamente** (la
consulta usa `oficina = $2`, sensible a mayúsculas, acentos y espacios, **sin
normalizar**). En cambio, el hash usa `getOfficeHashCode`, que **sí** normaliza
vía alias. Son dos estrategias distintas.

Si algún usuario de CDE se crea con una variante ("CIUDAD DEL ESTE",
"Ciudad Del Este", con espacio final) — por ejemplo importado con
`importar-usuarios-excel.js` — sus denuncias formarían una **secuencia de
numeración separada** (su propio orden 1, 2, 3…) que choca conceptualmente con el
conjunto canónico, mientras el hash igual resolvería a `'CE'`.

**Recomendación:** antes de liberar, verificá que todos los usuarios de CDE tengan
estrictamente `'Ciudad del Este'` (el valor de `ACTIVE_OFFICES`). Ideal a futuro:
normalizar la oficina en la consulta de orden igual que en el hash, o restringir
el valor con un CHECK/enum.

### 3. IMPORTANTE — Provisión de seriales (códigos de activación) para las terminales del nodo

Sin dispositivo autorizado, las terminales no funcionan: el `middleware` redirige
a `/autenticar` y el login devuelve 403 sin fingerprint. Hay que **generar los
códigos de activación de las terminales de CDE** antes del lanzamiento.

Si querés restringirlas a la oficina, usá serial tipo
`'oficina' = "Ciudad del Este"` (la verificación en
`verificarRestriccionesDispositivo` normaliza acentos/mayúsculas de forma
robusta).

**Ojo:** el selector de oficina en `gestion-dispositivos` es una **lista
hardcodeada aparte** (incluye oficinas que ni existen en `ACTIVE_OFFICES`), así
que elegí exactamente "Ciudad del Este" ahí también.

### 4. SEGURIDAD (transversal, pero crítico) — Cookie de sesión sin firmar → escalación de privilegios

`usuario_sesion` se emite con `httpOnly: false` y es JSON plano (solo
URL-encoded) que contiene `rol` y `oficina`, **sin firma/HMAC**. Endpoints como
`POST /api/usuarios` confían directamente en `creador.rol` leído de esa cookie, y
`/api/auth/sesion` la re-emite tal cual.

Cualquier usuario autenticado puede editar la cookie en el navegador y ponerse
`rol: "developer"` o cambiar su `oficina`, obteniendo permisos de administración,
acceso entre oficinas, o **bypass total de la restricción de dispositivo** (el rol
`developer` saltea toda validación en `verificarRestriccionesDispositivo`). Con un
nuevo nodo regional se amplía quién podría manipular esto.

**Recomendación:** firmar la sesión (JWT/HMAC) o usar sesión en servidor, marcarla
`httpOnly`, y re-verificar el rol contra la BD en acciones privilegiadas.

### 5. SEGURIDAD — Backdoor permanente hardcodeado

En `lib/auth.ts` el código `'261220251624382049BARB'` autoriza **cualquier
dispositivo, sin límite y para siempre**. El código `'DEMOSTRACION'` ya expiró
(22/12/2025) pero sigue en el código.

**Recomendación:** eliminar ambos antes de exponer un nuevo nodo; el de BARB es un
bypass permanente de todo el control de dispositivos.

### 6. MENOR — Verificar que las migraciones estén aplicadas en producción

Las migraciones son manuales (`npm run migrate`). Confirmá que la 015 (índice
único) y el resto hasta la 024 estén aplicadas en la BD de producción; si la 015
no está, el punto #1 deja de ser un error visible y pasa a ser **corrupción
silenciosa** (dos actas con el mismo número).

### 7. MENOR — El middleware solo comprueba la presencia de la cookie, no su validez

El middleware solo comprueba la *presencia* de la cookie `device_fingerprint`, no
su validez (la validación real está en las rutas API). Está mitigado en el login
porque revalida contra la BD, pero conviene tenerlo presente.

---

## Nota (no es un bug)

CDE no aparecerá en los filtros de reportes (`/api/reportes/filtros` hace
`DISTINCT oficina FROM denuncias`) hasta que se registre la primera denuncia. Es
el comportamiento esperado.

---

## Correcciones de mayor impacto para el lanzamiento

Los tres puntos con mayor impacto directo sobre la liberación del nodo:

1. **#1** — Reintento ante `23505` en la asignación de orden.
2. **#2** — Normalización de oficina en la consulta de orden.
3. **#5** — Remoción de los backdoors hardcodeados.

---

## Cambios aplicados (rama `development`)

> Implementados el 2026-07-04 en la rama `development`. Ningún cambio elimina ni
> modifica datos de la base. No se ha hecho push ni merge (pendiente de orden
> explícita). TypeScript compila sin errores (`tsc --noEmit`, exit 0).

- **#1 — Condición de carrera en la numeración.** En `app/api/denuncias/nueva/route.ts`
  se agregó un *advisory lock* de transacción por `(oficina, año)`
  (`pg_advisory_xact_lock`) antes de calcular el número de orden, en las dos ramas
  (borrador e inserción nueva). Esto serializa la asignación incluso cuando la
  oficina no tiene denuncias aún (nodo vacío), donde el `FOR UPDATE` no bloqueaba
  nada. Además, el `catch` ahora detecta el error `23505` y responde **409**
  reintentable en vez de un **500** genérico.

- **#2 — Consistencia del string `oficina`.** Nueva función
  `canonicalizarOficina()` en `lib/data/oficinas.ts` (tolera acentos, mayúsculas y
  espacios; preserva valores desconocidos). Se aplica al escribir la oficina en:
  creación/edición de usuarios (`app/api/usuarios/route.ts`,
  `app/api/usuarios/[id]/route.ts`), creación de denuncias y borradores
  (`app/api/denuncias/nueva/route.ts`, `app/api/denuncias/borrador/route.ts`), y en
  las consultas de numeración de orden. Nota: canoniza *hacia adelante*; los datos
  ya existentes con variantes deben revisarse con el script del punto #6.

- **#3 — Provisión de seriales (operativo).** Ver checklist de lanzamiento abajo.

- **#4 — Cookie de sesión firmada.** Nuevo helper `lib/sesion.ts` que firma la
  cookie `usuario_sesion` con **HMAC-SHA256** y la marca `httpOnly`. Todos los
  endpoints que confiaban en el rol/oficina de la cookie (16 rutas) ahora usan
  `leerSesion(request)`, que rechaza cookies manipuladas o sin firma. El
  `POST /api/auth/sesion` **dejó de reconstruir la sesión con datos del cliente**
  (era el vector de escalada de privilegios): ahora solo refresca una sesión ya
  firmada válida. `login` y `cambiar-password` emiten la cookie firmada.
  Verificado con pruebas: firma round-trip correcta y rechazo de escalada de rol,
  de formato antiguo y de firmas con otro secreto.

- **#5 — Backdoors.** En `lib/auth.ts` se eliminó la capacidad de autorizar
  dispositivos con los códigos `DEMOSTRACION` y `261220251624382049BARB`, y el
  bypass de restricciones asociado. Los dispositivos `DEMOSTRACION` residuales se
  **revocan** automáticamente al próximo acceso; los `BARB` existentes se conservan
  degradados a tipo `general` (decisión: no cortar terminales legítimas en uso).

- **#6 — Verificación de despliegue.** Nuevo script **de solo lectura**
  `scripts/verificar-preparacion-nodo.js`: confirma el índice único (migración
  015), busca actas duplicadas, detecta variantes no canónicas de oficina, informa
  el estado del nodo CDE y los dispositivos residuales de backdoors. Ejecutar con
  `node scripts/verificar-preparacion-nodo.js` (requiere `DATABASE_URL`).

- **#7 — Middleware.** Ahora valida el *formato* del `device_fingerprint` (SHA-256,
  64 hex) además de su presencia, descartando cookies basura antes de servir la
  página. La validación fuerte contra la BD sigue en las rutas API.

### Notas para el despliegue (importante)

1. **Re-login tras el deploy.** Al firmar la cookie, las sesiones con el formato
   anterior quedan invalidadas: **todos los usuarios deberán iniciar sesión de
   nuevo** una vez. Es un efecto único y esperado; conviene coordinar el momento.
2. **Definir `SESSION_SECRET`** en producción (ver `VARIABLES_ENTORNO.md`). Debe
   ser estable: si cambia, invalida todas las sesiones. Si no se define, se usa
   `DATABASE_URL` como respaldo.
3. **Ejecutar el script del #6** contra producción antes de liberar CDE, para
   confirmar el índice único y detectar variantes de oficina o actas duplicadas
   preexistentes.
4. **Auditar dispositivos `BARB`** (si el script los reporta) y revocarlos
   manualmente desde la gestión de dispositivos si no corresponden a terminales
   legítimas.

### Checklist operativo de lanzamiento del nodo CDE (#3)

- [ ] Crear los usuarios de CDE con oficina exactamente **"Ciudad del Este"** (el
      alta ya canoniza el valor).
- [ ] Generar los **códigos de activación** de las terminales de CDE. Para
      restringirlas a la oficina, usar serial tipo **"oficina" = "Ciudad del Este"**.
- [ ] Verificar que las migraciones (especialmente la **015**) estén aplicadas en
      producción (usar el script del #6).
- [ ] Confirmar `SESSION_SECRET` configurado y coordinar el re-login posterior al
      deploy.
