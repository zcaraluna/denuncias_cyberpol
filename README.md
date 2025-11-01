# Sistema de Denuncias Policiales - CYBERPOL

Plataforma web moderna para la gestión de denuncias policiales desarrollada con Next.js y PostgreSQL.

## Características

- Sistema de autenticación para operadores policiales
- Formulario multi-paso para creación de denuncias (3 pasos: Denunciante, Supuesto Autor, Detalles)
- Integración con Google Maps para selección de ubicación con coordenadas GPS
- Generación automática de PDFs con QR codes y firmas
- Interfaz moderna e intuitiva con diseño responsive
- Base de datos PostgreSQL con relaciones optimizadas
- Historial de denuncias con filtros de búsqueda
- Sistema de hash único por denuncia con identificación de oficina

## Requisitos

- Node.js 18+ 
- PostgreSQL 12+
- Variables de entorno configuradas (ver .env.example)
- Google Maps API Key (opcional, para selección de ubicación)

## Instalación

1. Clonar el repositorio o descargar los archivos
2. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configurar variables de entorno:
   - Copia `.env.example` a `.env.local`
   - Configura `DATABASE_URL` con tu conexión a PostgreSQL
   - Configura `NEXTAUTH_SECRET` (genera uno con: `openssl rand -base64 32`)
   - (Opcional) Configura `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` para usar mapas

4. Inicializar la base de datos:
\`\`\`bash
npm run init-db
\`\`\`

Este comando creará todas las tablas necesarias y un usuario de ejemplo:
- Usuario: `admin`
- Contraseña: `admin123`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en http://localhost:3000

## Estructura del Proyecto

- `/app` - Páginas y rutas de Next.js (App Router)
- `/components` - Componentes reutilizables
- `/lib` - Utilidades y lógica de negocio
  - `/db` - Configuración de base de datos y esquemas
  - `/utils` - Funciones auxiliares (generación de PDFs, etc.)
- `/scripts` - Scripts de utilidad (inicialización de BD)
- `/app/api` - API Routes de Next.js

## Funcionalidades Principales

### Autenticación
- Login seguro con bcrypt
- Sesión basada en sessionStorage
- Protección de rutas

### Nueva Denuncia
- **Paso 1**: Datos del denunciante (validación automática de edad)
- **Paso 2**: Datos del supuesto autor (conocido/desconocido)
- **Paso 3**: Detalles de la denuncia, relato, coordenadas GPS

### Generación de PDF
- Formato legal según especificaciones
- Inclusión de logos oficiales
- QR code con información de la denuncia
- Firmas del interviniente y denunciante
- Hash único para verificación

### Historial
- Búsqueda por fecha, cédula o hash
- Descarga de PDFs guardados
- Tabla responsive con paginación

## Base de Datos

El esquema incluye las siguientes tablas:
- `usuarios` - Operadores policiales
- `denunciantes` - Información de denunciantes
- `denuncias` - Denuncias principales (incluye PDF en BYTEA)
- `supuestos_autores` - Información de supuestos autores
- `historial_denuncias` - Vista rápida para consultas

## Notas Importantes

- Los PDFs se generan usando PDFKit (equivalente a ReportLab en Python)
- El formato de fecha/hora se obtiene desde APIs externas o el sistema
- El hash de denuncia incluye identificador de oficina y año
- Las coordenadas GPS son opcionales pero recomendadas
- El monto de daño acepta formato con separadores de miles (punto)

## Producción

\`\`\`bash
npm run build
npm start
\`\`\`

Asegúrate de configurar todas las variables de entorno en tu plataforma de hosting.

