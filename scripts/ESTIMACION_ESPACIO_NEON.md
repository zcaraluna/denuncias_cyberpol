# Estimación de Uso de Espacio en Neon Database

## Análisis de la Estructura de Datos

### Tablas Principales y su Tamaño Estimado por Registro

#### 1. Tabla `denuncias` (la más grande)
- **Campo crítico:** `pdf BYTEA` - Almacena el PDF completo de cada denuncia
- **Otros campos grandes:** `relato TEXT`, `lugar_hecho TEXT`
- **Campos pequeños:** fechas, horas, IDs, etc.

**Tamaño estimado por denuncia:**
- **PDF (BYTEA):** 80-200 KB (promedio: ~120 KB)
  - PDF de 1-2 páginas: ~80-100 KB
  - PDF de 3-4 páginas: ~150-200 KB
  - PDF con mucho texto: hasta 250 KB
- **Datos de texto (relato, lugar_hecho):** 2-5 KB
- **Metadatos (fechas, IDs, etc.):** ~1 KB
- **Total por denuncia:** ~85-210 KB (promedio: ~125 KB)

#### 2. Tabla `denunciantes`
- **Tamaño estimado:** ~0.5-1 KB por denunciante
- **Nota:** Los denunciantes pueden ser reutilizados (misma persona, múltiples denuncias)

#### 3. Tabla `supuestos_autores`
- **Tamaño estimado:** ~0.3-0.5 KB por autor
- **Promedio:** 0-2 autores por denuncia

#### 4. Tabla `denuncias_involucrados`
- **Tamaño estimado:** ~0.5 KB por involucrado
- **Promedio:** 0-1 involucrado adicional por denuncia

#### 5. Otras tablas (usuarios, ampliaciones, etc.)
- **Tamaño estimado:** ~0.5-2 KB por denuncia (dependiendo de ampliaciones)

### Tamaño Total Estimado por Denuncia Completa

**Escenario Conservador (PDF pequeño, poco texto):**
- Denuncia: 85 KB
- Denunciante: 1 KB (nuevo) o 0 KB (reutilizado)
- Supuestos autores: 0.5 KB
- Involucrados: 0.5 KB
- Otros: 1 KB
- **Total: ~87-88 KB por denuncia**

**Escenario Promedio (PDF normal, texto moderado):**
- Denuncia: 125 KB
- Denunciante: 1 KB (nuevo) o 0 KB (reutilizado)
- Supuestos autores: 0.5 KB
- Involucrados: 0.5 KB
- Otros: 1 KB
- **Total: ~128 KB por denuncia**

**Escenario Pesimista (PDF grande, mucho texto):**
- Denuncia: 210 KB
- Denunciante: 1 KB
- Supuestos autores: 1 KB
- Involucrados: 1 KB
- Otros: 2 KB
- **Total: ~215 KB por denuncia**

## Cálculo de Capacidad

### Límite de Neon: 500 MB (plan gratuito)

**Usando el escenario promedio (128 KB por denuncia):**

```
500 MB = 500,000 KB
500,000 KB ÷ 128 KB/denuncia = ~3,906 denuncias
```

**Usando el escenario conservador (88 KB por denuncia):**

```
500 MB = 500,000 KB
500,000 KB ÷ 88 KB/denuncia = ~5,681 denuncias
```

**Usando el escenario pesimista (215 KB por denuncia):**

```
500 MB = 500,000 KB
500,000 KB ÷ 215 KB/denuncia = ~2,325 denuncias
```

## Estimación Realista

**Basado en datos típicos, puedes esperar:**
- **Mínimo:** ~2,300 denuncias (si todos los PDFs son grandes)
- **Promedio:** ~3,500-4,000 denuncias (escenario más probable)
- **Máximo:** ~5,500 denuncias (si los PDFs son pequeños y reutilizas denunciantes)

## Estimación de Tiempo

Para calcular cuánto tiempo te tomará llegar a 500 MB, necesitas saber tu **promedio de denuncias por día/mes**.

### Ejemplos de Proyección:

**Si haces 10 denuncias por día:**
- 3,500 denuncias ÷ 10 denuncias/día = **350 días** (~11.5 meses)
- 4,000 denuncias ÷ 10 denuncias/día = **400 días** (~13 meses)

**Si haces 20 denuncias por día:**
- 3,500 denuncias ÷ 20 denuncias/día = **175 días** (~5.8 meses)
- 4,000 denuncias ÷ 20 denuncias/día = **200 días** (~6.5 meses)

**Si haces 50 denuncias por día:**
- 3,500 denuncias ÷ 50 denuncias/día = **70 días** (~2.3 meses)
- 4,000 denuncias ÷ 50 denuncias/día = **80 días** (~2.6 meses)

**Si haces 100 denuncias por día:**
- 3,500 denuncias ÷ 100 denuncias/día = **35 días** (~1.2 meses)
- 4,000 denuncias ÷ 100 denuncias/día = **40 días** (~1.3 meses)

## Factores que Afectan el Tamaño

### Aumentan el tamaño:
1. **PDFs largos** (muchas páginas, mucho texto en el relato)
2. **Muchos supuestos autores** por denuncia
3. **Muchos involucrados** (co-denunciantes, abogados)
4. **Ampliaciones de denuncia** (cada ampliación genera un PDF adicional)
5. **Denunciantes únicos** (no reutilizas denunciantes existentes)

### Reducen el tamaño:
1. **PDFs cortos** (relatos breves)
2. **Reutilización de denunciantes** (misma persona, múltiples denuncias)
3. **Pocos supuestos autores**
4. **Sin ampliaciones**

## Recomendaciones

### Para Maximizar el Uso del Espacio:

1. **Optimizar PDFs:**
   - Considera comprimir los PDFs antes de guardarlos (aunque jsPDF ya los genera optimizados)
   - Revisa si realmente necesitas guardar el PDF completo en la BD

2. **Monitorear el uso:**
   ```sql
   -- Ver tamaño actual de la base de datos
   SELECT 
       pg_size_pretty(pg_database_size('neondb')) as tamaño_total;
   
   -- Ver tamaño de tablas individuales
   SELECT 
       schemaname,
       tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamaño
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   
   -- Ver tamaño de la tabla denuncias específicamente
   SELECT 
       pg_size_pretty(pg_total_relation_size('denuncias')) as tamaño_denuncias,
       COUNT(*) as total_denuncias,
       pg_size_pretty(pg_total_relation_size('denuncias') / NULLIF(COUNT(*), 0)) as tamaño_promedio_por_denuncia
   FROM denuncias;
   ```

3. **Considerar alternativas:**
   - Si llegas cerca del límite, considera:
     - Actualizar al plan de pago de Neon (más espacio)
     - Mover los PDFs a almacenamiento externo (S3, Cloudinary, etc.) y solo guardar referencias
     - Archivar denuncias antiguas

## Resumen Ejecutivo

**Respuesta directa a tus preguntas:**

1. **¿En cuánto tiempo superaré los 500MB?**
   - Depende de tu volumen diario de denuncias
   - Con 10 denuncias/día: ~11-13 meses
   - Con 20 denuncias/día: ~6 meses
   - Con 50 denuncias/día: ~2-3 meses
   - Con 100 denuncias/día: ~1 mes

2. **¿Cuántas denuncias podré hacer hasta llegar a 500MB?**
   - **Mínimo:** ~2,300 denuncias (escenario pesimista)
   - **Promedio:** ~3,500-4,000 denuncias (escenario más probable)
   - **Máximo:** ~5,500 denuncias (escenario optimista)

**Recomendación:** Monitorea el tamaño de tu base de datos periódicamente usando las consultas SQL proporcionadas arriba para tener una idea precisa de cuándo necesitarás actualizar tu plan.


