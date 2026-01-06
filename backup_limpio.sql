--
-- PostgreSQL database dump
--

-- Dumped from database version 18.1 (Ubuntu 18.1-1.pgdg22.04+2)
-- Dumped by pg_dump version 18.1 (Ubuntu 18.1-1.pgdg22.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.visitas_denuncias DROP CONSTRAINT IF EXISTS visitas_denuncias_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.visitas_denuncias DROP CONSTRAINT IF EXISTS visitas_denuncias_denuncia_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supuestos_autores DROP CONSTRAINT IF EXISTS supuestos_autores_denuncia_id_fkey;
ALTER TABLE IF EXISTS ONLY public.dispositivos_autorizados DROP CONSTRAINT IF EXISTS dispositivos_autorizados_codigo_activacion_id_fkey;
ALTER TABLE IF EXISTS ONLY public.denuncias DROP CONSTRAINT IF EXISTS denuncias_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.denuncias_involucrados DROP CONSTRAINT IF EXISTS denuncias_involucrados_representa_denunciante_id_fkey;
ALTER TABLE IF EXISTS ONLY public.denuncias_involucrados DROP CONSTRAINT IF EXISTS denuncias_involucrados_denunciante_id_fkey;
ALTER TABLE IF EXISTS ONLY public.denuncias_involucrados DROP CONSTRAINT IF EXISTS denuncias_involucrados_denuncia_id_fkey;
ALTER TABLE IF EXISTS ONLY public.denuncias DROP CONSTRAINT IF EXISTS denuncias_denunciante_id_fkey;
ALTER TABLE IF EXISTS ONLY public.codigos_activacion DROP CONSTRAINT IF EXISTS codigos_activacion_creado_por_fkey;
ALTER TABLE IF EXISTS ONLY public.ampliaciones_denuncia DROP CONSTRAINT IF EXISTS ampliaciones_denuncia_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ampliaciones_denuncia DROP CONSTRAINT IF EXISTS ampliaciones_denuncia_denuncia_id_fkey;
DROP INDEX IF EXISTS public.idx_visitas_usuario;
DROP INDEX IF EXISTS public.idx_visitas_denuncia;
DROP INDEX IF EXISTS public.idx_supuestos_autores_denuncia;
DROP INDEX IF EXISTS public.idx_dispositivos_ultimo_acceso;
DROP INDEX IF EXISTS public.idx_dispositivos_fingerprint;
DROP INDEX IF EXISTS public.idx_dispositivos_activo;
DROP INDEX IF EXISTS public.idx_denuncias_orden;
DROP INDEX IF EXISTS public.idx_denuncias_involucrados_denunciante;
DROP INDEX IF EXISTS public.idx_denuncias_involucrados_denuncia;
DROP INDEX IF EXISTS public.idx_denuncias_hash;
DROP INDEX IF EXISTS public.idx_denuncias_fecha;
DROP INDEX IF EXISTS public.idx_denunciantes_matricula;
DROP INDEX IF EXISTS public.idx_denunciantes_cedula;
DROP INDEX IF EXISTS public.idx_codigos_activacion_usado;
DROP INDEX IF EXISTS public.idx_codigos_activacion_nombre;
DROP INDEX IF EXISTS public.idx_codigos_activacion_codigo;
DROP INDEX IF EXISTS public.idx_codigos_activacion_activo;
DROP INDEX IF EXISTS public.idx_ampliaciones_fecha;
DROP INDEX IF EXISTS public.idx_ampliaciones_denuncia;
ALTER TABLE IF EXISTS ONLY public.visitas_denuncias DROP CONSTRAINT IF EXISTS visitas_denuncias_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_usuario_key;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.ampliaciones_denuncia DROP CONSTRAINT IF EXISTS unique_denuncia_numero;
ALTER TABLE IF EXISTS ONLY public.supuestos_autores DROP CONSTRAINT IF EXISTS supuestos_autores_pkey;
ALTER TABLE IF EXISTS ONLY public.historial_denuncias DROP CONSTRAINT IF EXISTS historial_denuncias_pkey;
ALTER TABLE IF EXISTS ONLY public.dispositivos_autorizados DROP CONSTRAINT IF EXISTS dispositivos_autorizados_pkey;
ALTER TABLE IF EXISTS ONLY public.dispositivos_autorizados DROP CONSTRAINT IF EXISTS dispositivos_autorizados_fingerprint_key;
ALTER TABLE IF EXISTS ONLY public.denuncias DROP CONSTRAINT IF EXISTS denuncias_pkey;
ALTER TABLE IF EXISTS ONLY public.denuncias_involucrados DROP CONSTRAINT IF EXISTS denuncias_involucrados_pkey;
ALTER TABLE IF EXISTS ONLY public.denuncias DROP CONSTRAINT IF EXISTS denuncias_hash_key;
ALTER TABLE IF EXISTS ONLY public.denunciantes DROP CONSTRAINT IF EXISTS denunciantes_pkey;
ALTER TABLE IF EXISTS ONLY public.denunciantes DROP CONSTRAINT IF EXISTS denunciantes_cedula_key;
ALTER TABLE IF EXISTS ONLY public.configuracion_sistema DROP CONSTRAINT IF EXISTS configuracion_sistema_pkey;
ALTER TABLE IF EXISTS ONLY public.codigos_activacion DROP CONSTRAINT IF EXISTS codigos_activacion_pkey;
ALTER TABLE IF EXISTS ONLY public.codigos_activacion DROP CONSTRAINT IF EXISTS codigos_activacion_codigo_key;
ALTER TABLE IF EXISTS ONLY public.ampliaciones_denuncia DROP CONSTRAINT IF EXISTS ampliaciones_denuncia_pkey;
ALTER TABLE IF EXISTS public.visitas_denuncias ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supuestos_autores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historial_denuncias ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dispositivos_autorizados ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.denuncias_involucrados ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.denuncias ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.denunciantes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.codigos_activacion ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ampliaciones_denuncia ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.visitas_denuncias_id_seq;
DROP TABLE IF EXISTS public.visitas_denuncias;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.supuestos_autores_id_seq;
DROP TABLE IF EXISTS public.supuestos_autores;
DROP SEQUENCE IF EXISTS public.historial_denuncias_id_seq;
DROP TABLE IF EXISTS public.historial_denuncias;
DROP SEQUENCE IF EXISTS public.dispositivos_autorizados_id_seq;
DROP TABLE IF EXISTS public.dispositivos_autorizados;
DROP SEQUENCE IF EXISTS public.denuncias_involucrados_id_seq;
DROP TABLE IF EXISTS public.denuncias_involucrados;
DROP SEQUENCE IF EXISTS public.denuncias_id_seq;
DROP TABLE IF EXISTS public.denuncias;
DROP SEQUENCE IF EXISTS public.denunciantes_id_seq;
DROP TABLE IF EXISTS public.denunciantes;
DROP TABLE IF EXISTS public.configuracion_sistema;
DROP SEQUENCE IF EXISTS public.codigos_activacion_id_seq;
DROP TABLE IF EXISTS public.codigos_activacion;
DROP SEQUENCE IF EXISTS public.ampliaciones_denuncia_id_seq;
DROP TABLE IF EXISTS public.ampliaciones_denuncia;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ampliaciones_denuncia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ampliaciones_denuncia (
    id integer NOT NULL,
    denuncia_id integer NOT NULL,
    numero_ampliacion integer NOT NULL,
    relato text NOT NULL,
    fecha_ampliacion date NOT NULL,
    hora_ampliacion character varying(10) NOT NULL,
    usuario_id integer,
    operador_grado character varying(50) NOT NULL,
    operador_nombre character varying(100) NOT NULL,
    operador_apellido character varying(100) NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ampliaciones_denuncia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ampliaciones_denuncia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ampliaciones_denuncia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ampliaciones_denuncia_id_seq OWNED BY public.ampliaciones_denuncia.id;


--
-- Name: codigos_activacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_activacion (
    id integer NOT NULL,
    codigo character varying(100) NOT NULL,
    usado boolean DEFAULT false,
    usado_en timestamp without time zone,
    dispositivo_fingerprint character varying(255),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por integer,
    expira_en timestamp without time zone,
    nombre character varying(200),
    activo boolean DEFAULT true,
    CONSTRAINT codigo_no_vacio CHECK ((length((codigo)::text) > 0))
);


--
-- Name: COLUMN codigos_activacion.nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codigos_activacion.nombre IS 'Nombre o descripción del código (ej: Oficina Central, Sucursal X)';


--
-- Name: COLUMN codigos_activacion.activo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.codigos_activacion.activo IS 'Indica si el código está activo (false = eliminado/desactivado)';


--
-- Name: codigos_activacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codigos_activacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: codigos_activacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codigos_activacion_id_seq OWNED BY public.codigos_activacion.id;


--
-- Name: configuracion_sistema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_sistema (
    clave character varying(100) NOT NULL,
    valor text NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: denunciantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.denunciantes (
    id integer NOT NULL,
    nombres character varying(200) NOT NULL,
    cedula character varying(50) NOT NULL,
    tipo_documento character varying(100),
    domicilio text,
    nacionalidad character varying(100),
    estado_civil character varying(50),
    edad integer,
    fecha_nacimiento date,
    lugar_nacimiento character varying(200),
    telefono character varying(50),
    correo character varying(200),
    profesion character varying(200),
    matricula character varying(100),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: denunciantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.denunciantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: denunciantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.denunciantes_id_seq OWNED BY public.denunciantes.id;


--
-- Name: denuncias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.denuncias (
    id integer NOT NULL,
    denunciante_id integer,
    fecha_denuncia date,
    hora_denuncia character varying(10),
    fecha_hecho date,
    hora_hecho character varying(10),
    tipo_denuncia character varying(200),
    otro_tipo character varying(200),
    relato text,
    lugar_hecho text,
    latitud numeric(10,8),
    longitud numeric(11,8),
    orden integer NOT NULL,
    usuario_id integer,
    oficina character varying(100) NOT NULL,
    operador_grado character varying(50) NOT NULL,
    operador_nombre character varying(100) NOT NULL,
    operador_apellido character varying(100) NOT NULL,
    monto_dano integer,
    moneda character varying(50),
    hash character varying(50) NOT NULL,
    pdf bytea,
    estado character varying(20) DEFAULT 'completada'::character varying,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_hecho_fin date,
    hora_hecho_fin character varying(10),
    CONSTRAINT check_completada CHECK (((((estado)::text = 'completada'::text) AND (fecha_denuncia IS NOT NULL) AND (hora_denuncia IS NOT NULL) AND (fecha_hecho IS NOT NULL) AND (hora_hecho IS NOT NULL) AND (tipo_denuncia IS NOT NULL) AND (relato IS NOT NULL) AND (lugar_hecho IS NOT NULL)) OR ((estado)::text = 'borrador'::text))),
    CONSTRAINT check_estado CHECK (((estado)::text = ANY ((ARRAY['borrador'::character varying, 'completada'::character varying])::text[])))
);


--
-- Name: denuncias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.denuncias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: denuncias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.denuncias_id_seq OWNED BY public.denuncias.id;


--
-- Name: denuncias_involucrados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.denuncias_involucrados (
    id integer NOT NULL,
    denuncia_id integer,
    denunciante_id integer,
    rol character varying(30) NOT NULL,
    representa_denunciante_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    con_carta_poder boolean DEFAULT false,
    carta_poder_fecha date,
    carta_poder_numero character varying(100),
    carta_poder_notario character varying(255),
    CONSTRAINT check_rol_denuncia CHECK (((rol)::text = ANY ((ARRAY['principal'::character varying, 'co-denunciante'::character varying, 'abogado'::character varying])::text[])))
);


--
-- Name: denuncias_involucrados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.denuncias_involucrados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: denuncias_involucrados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.denuncias_involucrados_id_seq OWNED BY public.denuncias_involucrados.id;


--
-- Name: dispositivos_autorizados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispositivos_autorizados (
    id integer NOT NULL,
    fingerprint character varying(255) NOT NULL,
    user_agent text,
    ip_address character varying(45),
    codigo_activacion_id integer,
    autorizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true,
    nombre character varying(200),
    CONSTRAINT fingerprint_no_vacio CHECK ((length((fingerprint)::text) > 0))
);


--
-- Name: COLUMN dispositivos_autorizados.nombre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dispositivos_autorizados.nombre IS 'Nombre heredado del código de activación usado';


--
-- Name: dispositivos_autorizados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dispositivos_autorizados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dispositivos_autorizados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dispositivos_autorizados_id_seq OWNED BY public.dispositivos_autorizados.id;


--
-- Name: historial_denuncias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_denuncias (
    id integer NOT NULL,
    nombre_denunciante character varying(200) NOT NULL,
    cedula_denunciante character varying(50) NOT NULL,
    operador character varying(200) NOT NULL,
    fecha_denuncia date NOT NULL,
    hora_denuncia character varying(10) NOT NULL,
    numero_orden integer NOT NULL,
    tipo_hecho character varying(200) NOT NULL,
    hash_denuncia character varying(50) NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: historial_denuncias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_denuncias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_denuncias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_denuncias_id_seq OWNED BY public.historial_denuncias.id;


--
-- Name: supuestos_autores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supuestos_autores (
    id integer NOT NULL,
    denuncia_id integer,
    autor_conocido character varying(20) DEFAULT 'Desconocido'::character varying NOT NULL,
    nombre_autor character varying(200),
    cedula_autor character varying(50),
    domicilio_autor text,
    nacionalidad_autor character varying(100),
    estado_civil_autor character varying(50),
    edad_autor integer,
    fecha_nacimiento_autor date,
    lugar_nacimiento_autor character varying(200),
    telefono_autor character varying(50),
    profesion_autor character varying(200),
    telefonos_involucrados character varying(200),
    numero_cuenta_beneficiaria character varying(200),
    nombre_cuenta_beneficiaria character varying(200),
    entidad_bancaria character varying(200),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    descripcion_fisica text
);


--
-- Name: supuestos_autores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supuestos_autores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supuestos_autores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supuestos_autores_id_seq OWNED BY public.supuestos_autores.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    usuario character varying(100) NOT NULL,
    "contraseña" character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    grado character varying(50) NOT NULL,
    oficina character varying(100) NOT NULL,
    rol character varying(50) DEFAULT 'operador'::character varying,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "debe_cambiar_contraseña" boolean DEFAULT true,
    CONSTRAINT check_rol CHECK (((rol)::text = ANY ((ARRAY['superadmin'::character varying, 'admin'::character varying, 'operador'::character varying, 'supervisor'::character varying])::text[])))
);


--
-- Name: COLUMN usuarios."debe_cambiar_contraseña"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios."debe_cambiar_contraseña" IS 'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión';


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: visitas_denuncias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitas_denuncias (
    id integer NOT NULL,
    denuncia_id integer,
    usuario_id integer,
    fecha_visita timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: visitas_denuncias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visitas_denuncias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visitas_denuncias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visitas_denuncias_id_seq OWNED BY public.visitas_denuncias.id;


--
-- Name: ampliaciones_denuncia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ampliaciones_denuncia ALTER COLUMN id SET DEFAULT nextval('public.ampliaciones_denuncia_id_seq'::regclass);


--
-- Name: codigos_activacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_activacion ALTER COLUMN id SET DEFAULT nextval('public.codigos_activacion_id_seq'::regclass);


--
-- Name: denunciantes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denunciantes ALTER COLUMN id SET DEFAULT nextval('public.denunciantes_id_seq'::regclass);


--
-- Name: denuncias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias ALTER COLUMN id SET DEFAULT nextval('public.denuncias_id_seq'::regclass);


--
-- Name: denuncias_involucrados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias_involucrados ALTER COLUMN id SET DEFAULT nextval('public.denuncias_involucrados_id_seq'::regclass);


--
-- Name: dispositivos_autorizados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos_autorizados ALTER COLUMN id SET DEFAULT nextval('public.dispositivos_autorizados_id_seq'::regclass);


--
-- Name: historial_denuncias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_denuncias ALTER COLUMN id SET DEFAULT nextval('public.historial_denuncias_id_seq'::regclass);


--
-- Name: supuestos_autores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supuestos_autores ALTER COLUMN id SET DEFAULT nextval('public.supuestos_autores_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: visitas_denuncias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas_denuncias ALTER COLUMN id SET DEFAULT nextval('public.visitas_denuncias_id_seq'::regclass);


--
-- Data for Name: ampliaciones_denuncia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ampliaciones_denuncia (id, denuncia_id, numero_ampliacion, relato, fecha_ampliacion, hora_ampliacion, usuario_id, operador_grado, operador_nombre, operador_apellido, creado_en) FROM stdin;
\.


--
-- Data for Name: codigos_activacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.codigos_activacion (id, codigo, usado, usado_en, dispositivo_fingerprint, creado_en, creado_por, expira_en, nombre, activo) FROM stdin;
2	06FF08CA3FDF54AA6391867ACA42DD08	t	2025-12-18 13:26:36.878964	bf04b646a4b3d1c55f0cce511ad67664a6c319e96c535ee28110c9938cda12ff	2025-12-18 13:26:28.343083	\N	2026-12-18 13:26:28.341	\N	t
4	9407D97C4FBB3E749A678BEE0BCBAF97	t	2025-12-18 13:53:51.821509	bf04b646a4b3d1c55f0cce511ad67664a6c319e96c535ee28110c9938cda12ff	2025-12-18 13:53:44.780008	\N	2053-05-04 13:53:44.778	Computadora GARV	t
1	F163F3231BF598A0DB7C613AF521C124	f	\N	\N	2025-12-18 13:21:56.125099	\N	2026-01-17 13:21:56.123	\N	f
5	9342401FD93F754EA0EE7D0F9E0872E3	t	2025-12-21 23:06:46.605376	bf04b646a4b3d1c55f0cce511ad67664a6c319e96c535ee28110c9938cda12ff	2025-12-21 23:06:37.532471	\N	2026-12-21 23:06:37.53	Computadora GARV	t
8	D6CD849C9EF7A8265026F0C6F87EF4FD	t	2025-12-22 04:53:15.783097	bf04b646a4b3d1c55f0cce511ad67664a6c319e96c535ee28110c9938cda12ff	2025-12-22 04:50:42.146797	\N	2026-12-22 04:50:42.121	ComputadoraGARV	t
9	FE0E428120C3A1FDB735233B189D0AE2	t	2025-12-22 08:40:31.915748	bf04b646a4b3d1c55f0cce511ad67664a6c319e96c535ee28110c9938cda12ff	2025-12-22 08:40:18.316531	\N	2026-01-21 08:40:18.314	\N	t
10	E8A3BC42A255C58857472FB1A6F21CB3	t	2025-12-22 13:21:50.992401	62d18984722ed057781bce4342a009271fd0bf4799981a048ca348f09af03584	2025-12-22 13:13:35.499794	\N	2026-12-22 13:13:35.493	OF INSP ROLDAN	t
3	B1E8FBE7D79D843048F45FB86DBB13EC	f	\N	\N	2025-12-18 13:49:45.184214	\N	2053-05-04 13:49:45.182	\N	f
6	8E5DA6F79AFF89959A2A24AE8CC1FC5F	f	\N	\N	2025-12-21 23:07:36.315334	\N	2026-12-21 23:07:36.313	Computadora Of. Roldan	f
7	942596274E84467C9C62B24FBADBBCBF	f	\N	\N	2025-12-22 04:38:15.726707	\N	2026-01-21 04:38:15.724	\N	f
11	9FCCDF04C25FDD7C56B4712550D83B22	f	\N	\N	2026-01-01 02:35:20.86062	\N	2026-01-31 02:35:20.859	\N	f
12	BE94ABF50CB802FB1C41293A83E732F9	t	2026-01-01 13:02:39.030584	a08c95d7741f0b52d4fb8a19ee2f0217bce302fd8d3406733217c0ec81789b1a	2026-01-01 12:59:51.325785	\N	2026-01-31 12:59:51.324	365	t
13	271C0A7909324EE7F6B2417758E82637	t	2026-01-01 13:07:17.7525	62d18984722ed057781bce4342a009271fd0bf4799981a048ca348f09af03584	2026-01-01 13:00:29.495825	\N	2027-01-01 13:00:29.494	PC1-ASU	t
14	E0576573019FA63265B7FBC1CC27A2A8	t	2026-01-01 13:09:43.41448	62d18984722ed057781bce4342a009271fd0bf4799981a048ca348f09af03584	2026-01-01 13:00:36.959862	\N	2027-01-01 13:00:36.958	PC2-ASU	t
\.


--
-- Data for Name: configuracion_sistema; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_sistema (clave, valor, descripcion, actualizado_en) FROM stdin;
requiere_autenticacion_dispositivo	false	Si es true, se requiere código de activación de dispositivo. Si es false, cualquier usuario puede acceder sin código.	2025-12-22 08:38:00.658465
\.


--
-- Data for Name: denunciantes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.denunciantes (id, nombres, cedula, tipo_documento, domicilio, nacionalidad, estado_civil, edad, fecha_nacimiento, lugar_nacimiento, telefono, correo, profesion, matricula, creado_en) FROM stdin;
10	OSCAR ANTONIO NUÑEZ GODOY	462632	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, CIUDAD DE ASUNCIÓN, BARRIO JARA SANTIAGO 1160 C/COMANDANTE MOLAS	PARAGUAYA	CASADO/A	68	1957-04-06	ASUNCION	0981410825	\N	EX MILITAR	\N	2026-01-02 20:55:25.644461
1	BRUNO ANDRES RODRIGUEZ ESCURRA	4849995	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de LUQUE, LUIS ALBERTO DE HERRERA CASI CALLE ULTIMA	PARAGUAYA	SOLTERO/A	29	1996-12-09	LUQUE	0971971840	brunitorodriguez10@gmail.com	COMERCIANTE	\N	2026-01-02 13:18:50.691126
2	OSVALDO AMADO FERRIRA COLNAGO	2376669	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, MANDUVIRA ESQ. OLEARY	PARAGUAYA	SOLTERO/A	50	1975-09-13	ASUNCIÓN	0981936506	osvaldoferreira2009@gmail.com	COMERCIANTE	\N	2026-01-02 14:46:32.749971
3	JUAN JOSE MARTINEZ	5376972	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de LIMPIO, 14 DE MAYO C/ LAS PERLAS	PARAGUAYA	SOLTERO/A	43	1982-05-05	ENCARNACION	0961708765	juanjozapata051182@gmail.com	VENDEDOR	\N	2026-01-02 15:02:57.266616
4	PATRICIA CAROLINA SERVIN RODRIGUEZ	6165172	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de CAPIATÁ, RUTA DEPARTAMENTAL DE 027 KM 21 1/2 BARRIO SAN JUAN	PARAGUAYA	SOLTERO/A	29	1996-05-01	ASUNCION	0983585520	patycservin@gmail.com	LIC. EN ADMINISTRACION DE EMPRESA	\N	2026-01-02 16:19:52.85745
5	CARLOS ARIEL RAMIEZ BOBADILLA	3913369	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de LAMBARÉ, ONOFRE GOMEZ Y ALBERDI	PARAGUAYA	SOLTERO/A	39	1986-12-22	ASUNCION	0992979048	carlosarielramirez420@gmail.com	COCINERO	\N	2026-01-02 16:24:03.157437
6	SERGIO DANIEL VILLALBA DOMINGUEZ	4976567	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de ÑEMBY, ARQ. TOMAS ROMERO PEREIRA CASI PASEO VECINAL	PARAGUAYA	SOLTERO/A	35	1990-01-12	ÑEMBY	0985439317	sdv716@gmail.com	TECNICO INDEPENDIENTE	\N	2026-01-02 18:38:20.729697
7	CATALINA MONTES ALVEAR	5419700	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, SAN VICENTE/JUAN ZORRILLA DE SAN MARTIN	PARAGUAYA	SOLTERO/A	20	2005-02-09	ASUNCION	0961959776	catalinama50@gmail.com	ESTUDIANTE	\N	2026-01-02 18:54:28.045619
8	ANDRES DANIEL CHAMORRO RUIZ DIAZ	2447085	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, PROFESOR AMARILLA 442 CASI 34 CURUGUATEÑOS	PARAGUAYA	SOLTERO/A	46	1979-07-04	ASUNCIÓN	0981338259	\N	EMPLEADO	\N	2026-01-02 19:49:16.967595
9	SOPHIA CAMILA ROXANA MEZA SEGOVIA	6141681	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, BRITEZ BORGES/ CENTENARIO DE LA EPOPEYA NACIONAL	PARAGUAYA	SOLTERO/A	19	2006-09-28	ASUNCION	0987321668	sophiacamilaroxana2@gmail.com	SIN EMPLEO	\N	2026-01-02 20:48:57.239853
17	ADRIANA RAQUEL ESCOBAR ALFONZO	2372146	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, AVENIDA LA VICTORIA ESQUINA YVYRAJU BARRIO SAN PABLO DE LA CIUDAD DE ASUNCION	PARAGUAYA	SOLTERO/A	46	1979-06-25	ASUNCION	0985449941	\N	AMA DE CASA	\N	2026-01-05 15:26:18.989838
18	JUAN MARCELO PINTOS MARTÍNEZ	3197475	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de SAN LORENZO, SOBRE LA CALLE CONSEJAL GODOY CASI VENEZUELA, BARRIO ESPIRITU SANTOS DE LA CIUDAD DE SAN LORENZO, A TRES CUADRAS DEL SUPERMERCADO STOCK	PARAGUAYA	CASADO/A	46	1979-10-08	ASUNCION	0991684025 . 0991684496	jpintos2@gmail.com	ANALISTA DE SISTEMAS	\N	2026-01-05 16:08:58.323298
19	GUSTAVO ADOLFO BENITEZ AGUILERA	5076511	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de AREGUÁ, CALLE 18 DE OCTUBRE/FRANCISCO SOLANO LOPEZ	PARAGUAYA	SOLTERO/A	28	1998-01-03	ASUNCION	0983719803	gustavoadolfobenitezaguilera@gmail.com	\N	\N	2026-01-05 16:28:54.230949
11	CIRILO ANTONIO NUÑEZ GIMENEZ	5289793	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, CIUDAD DE ASUNCIÓN, SANTIAGO 1160 C/ CMDTE. MOLAS, BARRIO JARA	PARAGUAYA	SOLTERO/A	24	2001-04-09	ASUNCIÒN	0994497741	\N	ESTUDIANTE	\N	2026-01-02 21:18:55.388311
12	FERNANDO JAVIER DIAZ TORRES	3195926	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, TT. LEONIDAS ESCOBAR 4538	PARAGUAYA	SOLTERO/A	46	1979-06-02	ASUNCION	0991221423	\N	INDEPENDIENTE	\N	2026-01-03 11:43:25.407367
13	RICHARD MANUEL CACERES CABAÑAS	3274986	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, 26 PROYECTADAS Y PERU BARRIO ROBERTO L. PETIT	PARAGUAYA	SOLTERO/A	42	1983-01-05	ASUNCION	0982355372	rrmacaceres138@gmail.com	ELECTRICISTA	\N	2026-01-03 11:51:49.518061
14	OSMAE ARIEL PERALTA CORONEL	3498796	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de AREGUÁ, MARISCAL LOPEZ CALLE SIN NOMBRE BARRIO SAN MIGUEL	PARAGUAYA	SOLTERO/A	40	1985-11-07	ASUNCION	0991274223	osmarperalta174@gmail.com	CHOFER	\N	2026-01-03 14:19:53.967279
20	ROSA IRALA RODRIGUEZ	5751973	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de ÑEMBY, ACCESO SUR C/ PRESIDENTE FRANCO	PARAGUAYA	SOLTERO/A	30	1995-08-30	HORQUETA	0985418003	nildarossana1719@gmail.com	VENDEDORA	\N	2026-01-05 18:14:37.006387
21	JUAN JOSE GENDE FERNANDEZ	1814168	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, CEFERINO DE GAONA 374 C/ HASSLER	URUGUAYA	CASADO/A	70	1955-11-19	MONTEVIDEO - URUGUAY	0982649550	gendejj@gmail.com	ARQUITECTO	\N	2026-01-05 18:37:31.153165
15	RUTH NOEMI MARTINEZ LOCIO	3499152	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de FERNANDO DE LA MORA, DEPARTAMENTO CENTRAL, CIUDAD DE FERNANDO DE LA MORA, FRANCISCO BOGARIN CASI ISLA POI	PARAGUAYA	SOLTERO/A	39	1986-03-05	CORONEL BOGADO	0981339330	ruthimartinez08@gmail.com	ODONTOLOGA	\N	2026-01-05 12:19:54.51606
25	SHIRLEY MARLENE BLASMINIA RAIMUNDO DUARTE	3426604	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, TARUMA 1013 ESQUINA DR. MENDEZ PAIVA - BARRIO NAZARETH- DE LA CIUDAD DE ASUNCIÓN	PARAGUAYA	SOLTERO/A	41	1984-02-03	ASUNCIÓN	0984482780	shirleyraimundo128@gmail.com	EMPLEADA	\N	2026-01-05 19:55:52.142456
16	CARLOS ANIBAL GONZÁLEZ ALEGRE	1202955	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de VILLA ELISA, SOBRE LA CALLE GUAVIJU N° 124 CASI AVENIDA TENIENTE AMÉRICO PICO, BARRIO TRES BOCAS DE LA CIUDAD DE VILLA ELISA, A UNA CUADRA DE LA COMISARIA 11 ARROYO SECO.	PARAGUAYA	SOLTERO/A	57	1968-09-16	ASUNCION	034697479396 - 0983278460	carlosanibalg6124@outlook.com	CONSTRUCTOR	\N	2026-01-05 13:50:12.930037
22	KEVIN ALEJANDRO MENDOZA MORA	5527407	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de CAPIATÁ, 8 DE DICIEMBRE C/ AVDA. LA VICTORIA/ SAN LORENZO	PARAGUAYA	SOLTERO/A	22	2003-02-26	ASUNCION	0982124750	alemorajan@gmail.com	ENCARGADO DE COBRANZAS	\N	2026-01-05 18:51:34.847594
23	JUAN BAUTISTA PRIETO ROBLES	2045173	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de CAPIATÁ, FRACCION GUILLERMO SEGUNDO C/ ASUNCION FLORES	ARGENTINA	CASADO/A	52	1973-01-27	ALMIRANTE BROWN- ARG	0984041189	grupotroche2024@gmail.com	EMPLEADO	\N	2026-01-05 19:02:42.75285
24	NORMA BEATRIZ BOGADO VDA. DE RODRIGUEZ	928605	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, SOBRE LA CALLE SOLDADO PARAGUAYO N°1132 CASI TENIENTE VILLAMAYOR, BARRIO VIRGEN DEL HUERTO DE LA CIUDAD DE ASUNCION, A UNA CUADRA DEL HOSPITAL INERAN.	PARAGUAYA	VIUDO/A	60	1965-03-17	ASUNCION	0981419028 - 0986433881	norbogado2@jahoo.com.ar	MEDICO CIRUJANO	\N	2026-01-05 19:05:01.172463
26	VICTOR JAVIER GONZALEZ FERNANDEZ	4656756	Cédula de Identidad Paraguaya	ciudad de ASUNCIÓN, 37 PROYECTADAS ESQ. 25 DE JUNIO- BARRIO SAN CAYETANO DEL BAÑADO SUR	PARAGUAYA	SOLTERO/A	26	1999-07-29	ASUNCION	0972552903	victorgonzalezfer99@gmail.com	EMPLEADO	\N	2026-01-05 21:14:15.415653
30	DENUNCIANTE PRUEBA	1010101	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de LUQUE, CAMPO GRANDE	PARAGUAYA	CASADO/A	28	1997-11-09	LUQUE	0931221221	\N	\N	\N	2026-01-06 01:44:40.562332
31	DENUNCIANTE2 PRUEBA	998998	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de LUQUE, CAMPO GRANDE	PARAGUAYA	VIUDO/A	28	1997-11-09	ASUN	0983101010	\N	\N	\N	2026-01-06 02:03:41.250204
32	DENUNCIA17 PRUEBA	123123	Cédula de Identidad Paraguaya	departamento CENTRAL, ciudad de LUQUE, CAMPO GRANDE	PARAGUAYA	VIUDO/A	28	1997-11-09	ASUNCION	0912388282	\N	\N	\N	2026-01-06 02:09:11.718139
\.


--
-- Data for Name: denuncias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.denuncias (id, denunciante_id, fecha_denuncia, hora_denuncia, fecha_hecho, hora_hecho, tipo_denuncia, otro_tipo, relato, lugar_hecho, latitud, longitud, orden, usuario_id, oficina, operador_grado, operador_nombre, operador_apellido, monto_dano, moneda, hash, pdf, estado, creado_en, fecha_hecho_fin, hora_hecho_fin) FROM stdin;
13	10	2026-01-02	17:37	2026-01-02	15:48	HECHO PUNIBLE A DETERMINAR	\N	Que, en la fecha y hora mencionadas más arriba, recibe una llamada telefónica del abonado número 0987 417 470, quien manifiesta ser personal de la empresa de telefonía TIGO, solicitándole que proporcione un código que sería enviado vía WhatsApp, supuestamente para la actualización de los servicios. El recurrente proporciona dicho código y, seguidamente, vuelve a recibir una llamada telefónica del abonado número +56 129 934 93, la cual no es respondida.\nMinutos después, su hijo, de nombre Cirilo Antonio Núñez Giménez, con C.I. Nº 5.289.793, le informa que ya había realizado la transferencia que le había sido solicitada vía WhatsApp, la cual fue enviada a la cuenta Nº 8112931183, con cargo al Banco Familiar S.A.E.C.A., registrada a nombre de Laura Carolina Ramos Amarilla, con C.I. Nº 3.906.944, por un importe de 1.200.000 Gs. (un millón doscientos mil guaraníes).\nAsimismo, el recurrente se pone en contacto con otros familiares, quienes también le manifiestan que desde su número telefónico se les estaba solicitando dinero, situación que el recurrente desconoce totalmente, motivo por el cual comparece a poner los hechos en conocimiento de las autoridades competentes.	CIUDAD DE ASUNCIÓN, BARRIO JARA SANTIAGO 1160 C/COMANDANTE MOLAS	\N	\N	10	182	Asunción	Suboficial Ayudante	GERMAN EMANUEL	RUIZ DÍAZ	\N	\N	263D1DA26	\N	completada	2026-01-02 20:56:05.139731	\N	\N
14	11	2026-01-02	18:06	2026-01-02	15:52	HECHO PUNIBLE A DETERMINAR	\N	Que en fecha y hoira mencionada mas arriba, recibe un mensaje de texto via WhatsApp, del abonado Nº 0981410825, el cual pertenece a su señor padre de nombre OSCAR ANTONIO NUÑEZ GODOY, el cual le solicita que realice una transferencia a la cuenta Nº 8112931183, con cargo BANCO FAMILIAR S.A.E.C.A, registrado a nombre de LAURA CAROLINA RAMOS AMARILLA, con C.I Nº 3906944, por el monto de 1200000gs (un millon doscientos mil guaranies), con Operaciòn Nº 61793521, y referencia Nº BGNBPYPX02012657420039143778, de la cuenta debitada Nº 13115652001. seguidamente se comunica via telefonica con su señor padre mencionandole que ya habia realizado la transferencia solicitada, a lo que el padre le menciona que desconoce dicha solicitud, y que el mismo no la habia realizado, por lo que viene a oponer a conocimiento de lo sucedido a las autoridades competentes. 	CIUDAD DE ASUNCIÓN, SANTIAGO 1160 C/ CMDTE MOLAS, BARRIO JARA	\N	\N	-4	166	Asunción	Oficial Ayudante	MARÍA SOLEDAD	MIRANDA AMARILLA	\N	\N	AB8AA0A26	\N	borrador	2026-01-02 21:18:55.388311	\N	\N
15	11	2026-01-02	18:06	2026-01-02	15:52	HECHO PUNIBLE A DETERMINAR	\N	Que en fecha y hoira mencionada mas arriba, recibe un mensaje de texto via WhatsApp, del abonado Nº 0981410825, el cual pertenece a su señor padre de nombre OSCAR ANTONIO NUÑEZ GODOY, el cual le solicita que realice una transferencia a la cuenta Nº 8112931183, con cargo BANCO FAMILIAR S.A.E.C.A, registrado a nombre de LAURA CAROLINA RAMOS AMARILLA, con C.I Nº 3906944, por el monto de 1200000gs (un millon doscientos mil guaranies), con Operaciòn Nº 61793521, y referencia Nº BGNBPYPX02012657420039143778, de la cuenta debitada Nº 13115652001. seguidamente se comunica via telefonica con su señor padre mencionandole que ya habia realizado la transferencia solicitada, a lo que el padre le menciona que desconoce dicha solicitud, y que el mismo no la habia realizado, por lo que viene a oponer a conocimiento de lo sucedido a las autoridades competentes. 	CIUDAD DE ASUNCIÓN, SANTIAGO 1160 C/ CMDTE MOLAS, BARRIO JARA	\N	\N	-5	166	Asunción	Oficial Ayudante	MARÍA SOLEDAD	MIRANDA AMARILLA	\N	\N	06F494A26	\N	borrador	2026-01-02 21:19:03.642347	\N	\N
16	11	2026-01-02	18:06	2026-01-02	15:52	HECHO PUNIBLE A DETERMINAR	\N	Que en fecha y hora mencionada mas arriba, recibe un mensaje de texto via WhatsApp, del abonado Nº 0981410825, el cual pertenece a su señor padre de nombre OSCAR ANTONIO NUÑEZ GODOY, el cual le solicita que realice una transferencia a la cuenta Nº 8112931183, con cargo BANCO FAMILIAR S.A.E.C.A, registrado a nombre de LAURA CAROLINA RAMOS AMARILLA, con C.I Nº 3906944, por el monto de 1200000gs (un millon doscientos mil guaranies), con Operaciòn Nº 61793521, y referencia Nº BGNBPYPX02012657420039143778, de la cuenta debitada Nº 13115652001. seguidamente se comunica via telefonica con su señor padre mencionandole que ya habia realizado la transferencia solicitada, a lo que el padre le menciona que desconoce dicha solicitud, y que el mismo no la habia realizado, por lo que viene a oponer a conocimiento de lo sucedido a las autoridades competentes. 	CIUDAD DE ASUNCIÓN, SANTIAGO 1160 C/ CMDTE MOLAS, BARRIO JARA	\N	\N	11	166	Asunción	Oficial Ayudante	MARÍA SOLEDAD	MIRANDA AMARILLA	\N	\N	3A2FFEA26	\N	completada	2026-01-02 21:20:53.236165	\N	\N
1	1	2026-01-02	09:53	2025-12-26	15:00	OTRO	EXTRAVIO DE CHEQUE 	Que, se presenta ante esta Dependencia Especializada, a efecto de formular denuncia sobre un supuesto hecho de extravío de 5 hojas de cheques, el cual se detalla a continuación: \nHoja de cheque a la vista Nº 46810892, de la cuenta Nº 4229951, Titular Bruno Rodriguez, cargo SUDAMERIS, Fecha de emisión  05/10/2025 y valor de guaranies 10.000.000 (Diez millones)-----\nHoja de cheque a la vista Nº 46810894, de la cuenta Nº 4229951, Titular Bruno Rodriguez, cargo SUDAMERIS,fecha de emision 05/10/2025 y de valor guaraníes 10.000.000 (diez millones)  ----------------------\nHoja de cheque a la vista Nº 47235531, de la cuenta Nº 4229951,  Titular Bruno Rodriguez, cargo SUDAMERIS,fecha de emision 09/11/2025 y de valor guaraníes 7.500.000 (siete millones quinientos mil)  ----------------------\nHoja de cheque a la vista Nº 47235532, de la cuenta Nº 4229951,  Titular Bruno Rodriguez, cargo SUDAMERIS,fecha de emision 09/11/2025 y de valor guaraníes 7.500.000 (siete millones quinientos mil) \nHoja de cheque a la vista Nº 47235533, de la cuenta Nº 4229951,  Titular Bruno Rodriguez, cargo SUDAMERIS,fecha de emision 09/11/2025 y de valor guaraníes 7.500.000 (siete millones quinientos mil) \n\nEl mismo desconoce las circunstancias del extravío. Por lo que viene a poner a conocimiento de la autoridad policial para los fines que hubiere lugar. -----------------\n		\N	\N	1	189	Asunción	Oficial Ayudante	MATIAS RAMÓN	ORTIGOZA GÓMEZ	\N	\N	E591BCA26	\N	completada	2026-01-02 13:18:50.691126	\N	\N
2	2	2026-01-02	11:26	2025-12-22	19:08	HECHO PUNIBLE CONTRA LOS BIENES DE LA PERSONA	\N	El mismo manifiesta que, en la fecha y horas mencionadas precedentemente, visualizó una publicación en MARKETPLACE de la red social FACEBOOK, correspondiente al perfil a nombre de DANIELA CONCEPCIÓN JIMÉNEZ, con URL: https://www.facebook.com.profile/profile.php?id=100025712233941, en la cual se ofrecían productos comestibles (queso y carne vacuna). Ante su interés, procedió a comunicarse con la misma a través de WHATSAPP, al abonado N° 0985 354 296, donde concretaron la venta de carne vacuna por el monto de 470.000 gs. (cuatrocientos setenta mil guaraníes). Para efectuar el pago, se le proporcionó la cuenta N° 301011790, correspondiente al BANCO SOLAR, registrada a nombre de MARCELO CABRERA FLEITAS, con correo electrónico danielaconcep13@gmail.com. Posteriormente, la mencionada persona le indicó que el producto sería entregado al día siguiente; sin embargo, hasta la fecha no recibió respuesta alguna, constatando además que fue bloqueado tanto en FACEBOOK como en WHATSAPP.	CIUDAD DE ASUNCIÓN, MANDUVIRA ESQ. OLEARY	\N	\N	2	166	Asunción	Oficial Ayudante	MARÍA SOLEDAD	MIRANDA AMARILLA	\N	\N	03CB57A26	\N	completada	2026-01-02 14:46:32.749971	\N	\N
3	3	2026-01-02	11:42	2025-09-02	00:00	HECHO PUNIBLE CONTRA EL PATRIMONIO	\N	Que se presenta ante esta dependencia especializada a fin de realizar una denuncia, menciona el recurrente que en fecha 31/12/2025 se percata de la existencia de 3 transacciones relacionadas a su tarjeta de credito cargo Banco ITAU  con cuenta numero 26338587, no reconocidas ni realizadas por el mismo, las cuales se detallan como sigue\n1. transaccion por valor de 700.000 guaranies, en fecha 02/09/2025 \n2.  transaccion por valor de 500.000 guaranies, en fecha 10/12/2025 \n3. transaccion por valor de 384.000 guaranies, en fecha 30/12/2025\nContinua relatando que desconoce totalmente la circunstancia en que se dieron el hecho mencionado. Por todo lo expuesto viene a poner a conocimiento de la autoridad competente para los fines que hubiere lugar conforme a derecho.\n	DEPARTAMENTO CENTRAL, CIUDAD DE LIMPIO, 14 DE MAYO C/ LAS PERLAS	\N	\N	3	188	Asunción	Suboficial Segundo	ROMINA GISELL	SÁNCHEZ SABABRIA	\N	\N	6298DDA26	\N	completada	2026-01-02 15:02:57.266616	\N	\N
4	4	2026-01-02	12:58	2025-12-30		EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS	\N	Que comparece ante esta Dependencia Especializada a fin de formular una denuncia respecto a un supuesto hecho ocurrido, en representacion de la empresa AGROSAH SOCIEDAD ANÓNIMA firmada por OSCAR EVELIO AGUILERA VELÁZQUEZ con cedula de identidad numero 2.809.427 y la recurrente. Manifiesta que, en fecha y hora ya mencionadas se percató del extravió de 1 (UNA) hoja de cheque diferido cargo Banco Continental, con Cta. Cte. Nº 94-00768549-01, a nombre de AGROSAH SOCIEDAD ANONIMA, cuyo número de hoja de cheque se detalla a continuación: CR 367857 , por el monto de Gs. 125.925.000 (ciento veinticinco millones novecientos veinticinco mil), desconociendo el lugar exacto del extravío, motivo por el cual se presenta ante esta dependencia Policial a realizar su denuncia. -----------	DEPARTAMENTO CENTRAL, CIUDAD DE FERNANDO DE LA MORA, FLORIDA1036 C/ ZAVALAS KUE	\N	\N	4	167	Asunción	Suboficial Ayudante	FATIMA	BERNAL FARIÑA	\N	\N	75C1E9A26	\N	completada	2026-01-02 16:19:52.85745	\N	\N
5	5	2026-01-02	12:29	2025-09-18	22:00	HECHO PUNIBLE CONTRA EL PATRIMONIO	\N	Que, se presenta ante esta Dependencia Especializada a fin de formular denuncia por un supuesto hecho de transacciones no reconocidas, ocurrido el día de 18/09/2025 la recurrente que a las 22:00 horas aproximadamente se percata que de algunas transacciones las cuales no reconoce realizadas en fecha 18/09/2025 la cual se detallan a continuación.\nLOC.: 650-2530000\nLIQ. MARCA guaranies 30.637 (Treinta mil seiscientos treinta y siete)\n11/09/25 – 11/09/25 – 2545939 IVA LEY 6380-S.DIGITAL guaranies 3.064 (Tres mil sesenta y cuatro)\n14/09/25 – 15/09/25 – 2584555 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 20.485 (Veinte mil cuatrocientos ochenta y cinco)\n14/09/25 – 15/09/25 – 2584556 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA GS: 127.940 (Ciento veintisiete mil novecientos cuarenta)\n14/09/25 – 15/09/25 – 2584557 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 51.176 (Cincuenta y un mil ciento setenta y seis)\n14/09/25 – 15/09/25 – 2584558 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 51.176 (Cincuenta y un mil ciento setenta y seis)\n14/09/25 – 15/09/25 – 2584559 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies guaranies 71.661 (Setenta y un mil seiscientos sesenta y uno)\n14/09/25 – 15/09/25 – 2584560 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 71.661 (Setenta y un mil seiscientos sesenta y uno)\n14/09/25 – 15/09/25 – 2584555 IVA LEY 6380-S.DIGITAL guaranies 2.049 (Dos mil cuarenta y nueve)\n14/09/25 – 15/09/25 – 2584556 IVA LEY 6380-S.DIGITAL guaranies 12.794 (Doce mil setecientos noventa y cuatro)\n14/09/25 – 15/09/25 – 2584560 IVA LEY 6380-S.DIGITAL guaranies 7.166 (Siete mil ciento sesenta y seis)\n14/09/25 – 15/09/25 – 2584557 IVA LEY 6380-S.DIGITAL guaranies 5.118 (Cinco mil ciento dieciocho)\n14/09/25 – 15/09/25 – 2584558 IVA LEY 6380-S.DIGITAL guaranies 5.118 (Cinco mil ciento dieciocho)\n14/09/25 – 15/09/25 – 2584559 IVA LEY 6380-S.DIGITAL guaranies 7.166 (Siete mil ciento sesenta y seis)\n15/09/25 – 15/09/25 – 17002 Mantenim. Mensual guaranies 20.000 (Veinte mil)\n15/09/25 – 15/09/25 – 4002 Seg. de canc. Deuda guaranies 1.556 (Mil quinientos cincuenta y seis)\n17/11/25 – 17/11/25 – 33001 GEST. REC CARTA COB guaranies 40.700 (Cuarenta mil setecientos)\n17/11/25 – 17/11/25 – 33001 GEST. REC. LLAMADA COB guaranies 27.000 (Veintisiete mil)\n17/11/25 – 17/11/25 – 17002 Mantenim. Mensual guaranies 20.000 (Veinte mil)\n17/11/25 – 17/11/25 – 4002 Seg. de canc. Deuda guaranies 2.057 (Dos mil cincuenta y siete)\nCOMPRAS REALIZADAS EN EL EXTERIOR (OCTUBRE)\n11/10/25 – 13/10/25 – 2866326 Google Telegram\nLOC.: 650-2530000 LIQ. MARCA :guaranies 30.000 (treinta mil) COTIZ.: guaranies  7.120 (siete mil ciento veinte)\n30.616 (Treinta mil seiscientos dieciséis)\n11/10/25 – 13/10/25 – 2866326 IVA LEY 6380-S.DIGITAL guaranies 3.062 (Tres mil sesenta y dos)\n17/10/25 – 17/10/25 – 17002 Mantenim. Mensual guaranies 20.000 (Veinte mil)\n1.739 (Mil setecientos treinta y nueve)\n18/12/25-18/12/25 4002 Seg. de canc. Deuda  guaranies 2.309 (dos mil trescientos nueve) \n18/12/25 - 18/12/25 - 33001 gest. rec. carta. cob guaranies 40.700 (cuarenta mil setecientos) \n18/12/25 - 18/12/25 - 33001 gest. rec. carta. cob guaranies 27.000 (veintisiete mil) \nSe adjuntan imágenes de dichas transacciones.\n\n		\N	\N	-1	189	Asunción	Oficial Ayudante	MATIAS RAMÓN	ORTIGOZA GÓMEZ	\N	\N	42F972A26	\N	borrador	2026-01-02 16:24:03.157437	\N	\N
6	5	2026-01-02	12:29	2025-09-18	22:00	HECHO PUNIBLE CONTRA EL PATRIMONIO	\N	Que, se presenta ante esta Dependencia Especializada a fin de formular denuncia por un supuesto hecho de transacciones no reconocidas, ocurrido el día de 18/09/2025 la recurrente que a las 22:00 horas aproximadamente se percata que de algunas transacciones las cuales no reconoce realizadas en fecha 18/09/2025 la cual se detallan a continuación.\nLOC.: 650-2530000\nLIQ. MARCA guaranies 30.637 (Treinta mil seiscientos treinta y siete)\n11/09/25 – 11/09/25 – 2545939 IVA LEY 6380-S.DIGITAL guaranies 3.064 (Tres mil sesenta y cuatro)\n14/09/25 – 15/09/25 – 2584555 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 20.485 (Veinte mil cuatrocientos ochenta y cinco)\n14/09/25 – 15/09/25 – 2584556 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA GS: 127.940 (Ciento veintisiete mil novecientos cuarenta)\n14/09/25 – 15/09/25 – 2584557 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 51.176 (Cincuenta y un mil ciento setenta y seis)\n14/09/25 – 15/09/25 – 2584558 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 51.176 (Cincuenta y un mil ciento setenta y seis)\n14/09/25 – 15/09/25 – 2584559 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies guaranies 71.661 (Setenta y un mil seiscientos sesenta y uno)\n14/09/25 – 15/09/25 – 2584560 Google Timeline Up\nLOC.: 650-2530000\nLIQ. MARCA guaranies 71.661 (Setenta y un mil seiscientos sesenta y uno)\n14/09/25 – 15/09/25 – 2584555 IVA LEY 6380-S.DIGITAL guaranies 2.049 (Dos mil cuarenta y nueve)\n14/09/25 – 15/09/25 – 2584556 IVA LEY 6380-S.DIGITAL guaranies 12.794 (Doce mil setecientos noventa y cuatro)\n14/09/25 – 15/09/25 – 2584560 IVA LEY 6380-S.DIGITAL guaranies 7.166 (Siete mil ciento sesenta y seis)\n14/09/25 – 15/09/25 – 2584557 IVA LEY 6380-S.DIGITAL guaranies 5.118 (Cinco mil ciento dieciocho)\n14/09/25 – 15/09/25 – 2584558 IVA LEY 6380-S.DIGITAL guaranies 5.118 (Cinco mil ciento dieciocho)\n14/09/25 – 15/09/25 – 2584559 IVA LEY 6380-S.DIGITAL guaranies 7.166 (Siete mil ciento sesenta y seis)\n15/09/25 – 15/09/25 – 17002 Mantenim. Mensual guaranies 20.000 (Veinte mil)\n15/09/25 – 15/09/25 – 4002 Seg. de canc. Deuda guaranies 1.556 (Mil quinientos cincuenta y seis)\n17/11/25 – 17/11/25 – 33001 GEST. REC CARTA COB guaranies 40.700 (Cuarenta mil setecientos)\n17/11/25 – 17/11/25 – 33001 GEST. REC. LLAMADA COB guaranies 27.000 (Veintisiete mil)\n17/11/25 – 17/11/25 – 17002 Mantenim. Mensual guaranies 20.000 (Veinte mil)\n17/11/25 – 17/11/25 – 4002 Seg. de canc. Deuda guaranies 2.057 (Dos mil cincuenta y siete)\n11/10/25 – 13/10/25 – 2866326 Google Telegram\nLOC.: 650-2530000 LIQ. MARCA :guaranies 30.000 (treinta mil) COTIZ.: guaranies  7.120 (siete mil ciento veinte)\n30.616 (Treinta mil seiscientos dieciséis)\n11/10/25 – 13/10/25 – 2866326 IVA LEY 6380-S.DIGITAL guaranies 3.062 (Tres mil sesenta y dos)\n17/10/25 – 17/10/25 – 17002 Mantenim. Mensual guaranies 20.000 (Veinte mil)\n1.739 (Mil setecientos treinta y nueve)\n18/12/25-18/12/25 4002 Seg. de canc. Deuda  guaranies 2.309 (dos mil trescientos nueve) \n18/12/25 - 18/12/25 - 33001 gest. rec. carta. cob guaranies 40.700 (cuarenta mil setecientos) \n18/12/25 - 18/12/25 - 33001 gest. rec. carta. cob guaranies 27.000 (veintisiete mil) \nSe adjuntan imágenes de dichas transacciones.\n\n	DEPARTAMENTO CENTRAL, CIUDAD DE LAMBARÉ, ONOFRE GOMEZ Y ALBERDI	\N	\N	5	189	Asunción	Oficial Ayudante	MATIAS RAMÓN	ORTIGOZA GÓMEZ	\N	\N	AD3A5EA26	\N	completada	2026-01-02 16:29:36.511236	\N	\N
7	6	2026-01-02	13:27	2026-12-01	05:00	HECHO PUNIBLE A DETERMINAR	\N	Que se presenta ante esta Dependencia Especializada a fin de formular una denuncia sobre un supuesto hecho, menciona el recurrente que en fecha 01/01/2026 en horas de la madrugada procede a descargar, y crear una cuenta en la plataforma telegram, siendo las 03:30 horas procede a entablar una conversación con un perfil de Nombre MILI (menciona el recurrente que dicho perfil de telegram ya fue eliminado), la persona Mili menciona que vende contenidos para adultos el recurrente interesado en dicha propuesta le pide fotos, momento en el cual el mismo tambien procede a enviar fotos intimas, tiempo despues dicha persona (MILI) procede a enviar su cuenta bancaria para el envio de dicho contenido que tendria un valor de Guaranies 70.000 por lo que el recurrente procede a enviar la suma de Guaranies 70.000 en la cuenta de Tu Financiera con Nº de cuenta 11760553 del titular MARI ESTELA CABALLERO FRANCO, luego de lo ocurrido la persona MILI envía su numero telefonico para realizar videollamada por lo que el recurrente procede a realizar la misma al abonado numero 0982060141, la persona MILI no contesta, tiempo despues la misma envia fotos intimas que el recurrente habria enviado en telegram  solicita transferencias de Guaranies 1.500.000 para no escracharlo públicamente, por lo que el recurrente procede a enviar la suma de guaranies de 1.500.000 por giros tigo al abonado numero 0982060141, luego la misma vuelve a pedir que deposite la suma de guaranies 1.000.000 a su Tigo Money, por lo que el recurrente vuelve a enviar la suma de Guaranies 1.000.000 al abonado numero 0982060141 con CI Nº 724099 a nombre de Cirilo Antonio Cabrera Toche, luego de lo acontecido el recurrente recibe un mensaje del abonado numero 0975833293 identificándose como su prima Rosmary Villalba advirtiéndole supuestamente que alguien estaria publicando fotos del mismo escrachandolo en la plataforma Facebook, la supuesta prima menciona que puede ayudar a eliminar dicha cuenta pero que tendria un costo de Guaranies 1.500.000, lo que el recurrente acepta y procede a enviar la suma solicitada en la cuenta Nº 249111916 a nombre de Dario Javier Oviedo Mora con CIº 3.590.747 luego la supuesta prima solicita el correo personal del recurrente para poder eliminar dicha cuenta, por lo que el recurrente facilita su correo Sdvd716@gmail.com a la supuesta prima, luego en fecha 02/01/2025 la supuesta prima envia varios videos del recurrente teniendo intimidad con su pareja, solicitando la suma de guaranies 5.000.000 para que no recorran dichos videos, por lo que el recurente se percata de que su cuenta de Gmail ha sido vulnerada, por todo lo ocurrido el mismo se acerca a esta dependencia para los fines que hubiera lugar  \n\n	DEPARTAMENTO CENTRAL, CIUDAD DE ÑEMBY, ARQ. TOMAS ROMEO PEREIRA CASI PASEO VECINAL	\N	\N	6	184	Asunción	Suboficial Ayudante	AXEL FERNANDO	DUARTE ORTIGOZA	\N	\N	B9AFC9A26	\N	completada	2026-01-02 18:38:20.729697	2025-12-26	22:00
8	7	2026-01-02	15:00	2025-12-31	20:15	HECHO PUNIBLE CONTRA EL PATRIMONIO	\N	Que se presenta ante esta Dependencia Especializada a fin de realizar una denuncia, menciona la recurrente que en fecha 31/12/2025 al visualizar en la pagina de Facebook una publicación de alquiler de un dúplex por valor de 2.000.000 Gs. (Dos millones de guaraníes) desde el perfil denominado Cesaar Olazaar con dirección de URL https://www.facebook.com/share/17i3gVdMsg/, decide contactar con el mismo, inicialmente a través de Messenger y posterior a través de WhatsApp después de que esta persona le solicitara su numero de contacto para poder conversar mejor, siendo las 16:30 Hs. recibió varios mensajes desde el numero 0971283489 identificándose con el nombre de Ever Samaniego supuesto encargado y amigo del propietario del dúplex a ser alquilado, quien le envió la ubicación y fotografías del dúplex, la denunciante se presento hasta la ubicación del lugar para poder ver el interior, pero cuando llego al lugar Ever le menciono que tuvo un inconveniente y que no iba poder llegar hasta el lugar para enseñarle la casa, pero que si estaba interesada podía realizar una seña por valor de 1.000.000 Gs (un millón de guaraníes), que seria el 50% del valor total del precio total del alquiler, para que se le reservara y no seguir publicando la oferta, la afectada continua relatando que como tenia interés en acceder al alquiler de dicho lugar accedió al pago de la seña solicitada, una vez que llegan a un acuerdo procedió al envió vía transferencia bancaria a la cuenta N°191610 a nombre del titular Fabio Marcial Garcete Leiva, con C.I. N°4.323.833 a las 20:15hs aproximadamente, cuenta proporcionada por el supuesto encargado y asesor del alquiler, acordaron de que para poder ver el interior de la casa debía ir el día de la fecha una vez en el lugar fueron recibidos por una pareja quien les enseño el interior del dúplex, al visualizar el lugar observaron ciertos detalles que le hacían dudar para poder alquilarlo, el supuesto asesor en todo momento les indico que cualquier cosa debían comunicarle a el motivo por el cual no intercambiaron ningún tipo de información con la pareja que les enseño el lugar por lo que dieron aviso de los detalles que observaron al encargado quien les dijo que esos detalles se podían mejorar o reparar pero que debían abonar la suma de 1.000.000 Gs. (un millón de guaraníes) mas como seña de garantía del lugar el cual iba ser utilizado para la refracción de la casa, como ya realizaron la primera seña accedieron nuevamente al envió del dinero solicitado a la misma cuenta bancaria mencionada con anterioridad, ya que esta persona le había prometido que una vez enviado el dinero iban a firmar un contrato por el alquiler, pero esta persona continuo solicitando mas suma de dinero con la excusa de que faltaba materiales para la refacción, por todo lo expuesto la denunciante cree que es victima de un supuesto hecho de estafa ya que hasta la fecha dejara de tener respuesta alguno por parte del supuesto encargado, también menciona que la misma había anotado el numero publicitado por el dúplex y como no recibís respuesta decidió llamar a ese numero percatándose ahí que la pareja que les había enseñado la casa eran los verdaderos encargados del lugar quienes le mencionaron que desconocían al tal Ever Samaniego y que esta persona estaría cometiendo estafas utilizando la verdadera oferta de alquiler que habían realizado los mismos en otro perfil. Por todo lo expuesto viene a poner a conocimiento de la autoridad competente para los fines que hubiere lugar conforme a derecho.	CIUDAD DE ASUNCIÓN, SAN VICENTE/JUAN ZORRILLA DE SAN MARTIN	\N	\N	7	182	Asunción	Suboficial Ayudante	GERMAN EMANUEL	RUIZ DÍAZ	\N	\N	831C80A26	\N	completada	2026-01-02 18:54:28.045619	\N	\N
9	8	2026-01-02	16:10	2025-01-02	11:45	OTRO	ESTAFA	Que, en fecha y hora indicada arriba, recibe un mensaje desde la plataforma de mensajeria whatsapp del abonado N° +12896996986 identificandose como la persona RAQUEL AGUILAR (su supuesta vecina que habia viajdo a españa) que, en la fotografía de perfil del usuario se visualizaba la última fotografía, la supuesta vecina argumenta que el motivo de su mensaje era para saludar por las fiestas de fin de año y para comentar que regresaria de sorpresa a Paraguay, que envió varios regalos y solicitó reserva y confidencialidad sobre el caso; al respecto, solicitó al denunciante que haga el favor de recibir la encomienda de parte de la empresa DHL. Que, la supuesta vecina del denunciante le envía al recurrente un documento en PDF en el que se visualiza una supuesta resolución de envío con membrete de la empresa DHL en el que se encontraban detallados varios articulos que serian enviados a la ubicación del denunciante; que, la entrega se realizaría recién el viernes es 02/01/2026. Agrega el recurrente que, en fecha viernes 02/01/2026, 11:50 horas, recibe llamada en Whatsapp del Número +18297749218, de parte de supuestos empleados de la empresa DHL, quienes le manifestaron que, en relación a los artículos a ser entregados de parte de su vecina Raquel Aguilar, los mismos estaban retenidos por sobre costo y que se debía pagar una supuesta multa por valor de Gs. 37.475.460 (guaraníes treinta y siete millones cuatrocientos setenta y cinco mil cuatrocientos sesenta); que, para evitar pago de aranceles adicionales, podían disponer de una cuenta local para que pueda recibir la transferencia de la multa, mencionan tambien que de no pagar la multa impuesta por la DNIT el denunciante seria denunciado por evacion de impuestos. En tal sentido, el denunciante informa todo lo anterior a su supuesta vecina, quien le indica que le transferirá el monto a su cuenta bancaria para que se ocupe de pagar las supuestas multas impuestas. Que, en fecha 02/01/2026, la supuesta vecina del recurrente envía una imagen en el que se visualiza un comprobante de transferencia del banco HSBC de USS 6.401 (dólares americanos seis mil cuatrocientos un) a la cuenta del primo del recurrente Junior Riquelme con banco GNB con Cuenta Nº 13066656002, le explica que, por ser una transferencia internacional, la acreditación del valor se haría efectivo en 24 a 72 horas; que, posteriormente volvió a escribir y explicó que, por indicaciones de su asesor jurídico le recomendaba que adelante el pago de la multa con su dinero debido a que se cumplía un supuesto plazo y por ello no quería perder los artículos en cuestión; al respecto, indicó que se realice el pagó por medio del sistema de giros de wester unión o por transferencia a una cuenta bancaria local de Paraguay, por todo lo acontecido el recurrente se apersona al Aeropuerto Silvio Petirossi a la oficina de la empresa DHL y es ahi donde la supuesta vecina le comenta al denunciante que e dicho paquete se encuentra la suma de dolares americanos 250.000 por ende exige al denunciante que apresure el pago de la multa ofreciendo una recompensa del 20% del valor presuntamente incluido en el paquete, es ahi donde el primo del recurrente se pone en contacto con la supuesta vecina explicandole que la mercaderia no estaria en paraguay momento en el cual la supuesta vecina alega que cambiaria de numero telefonico para no tener problemas. Por lo que pone a conocimiento de la autoridad policial para los fines en que hubiere lugar conforme a derecho.	CIUDAD DE ASUNCIÓN, PROFESOR AMARILLA 442 CASI 34 CURUGUATEÑOS	\N	\N	8	184	Asunción	Suboficial Ayudante	AXEL FERNANDO	DUARTE ORTIGOZA	\N	\N	0EF8B6A26	\N	completada	2026-01-02 19:49:16.967595	\N	\N
10	9	2026-01-02	16:34	2026-01-01	17:30	HECHO PUNIBLE A DETERMINAR	\N	Que se presenta ante esta Dependencia Especializada la recurrente, a fin de radicar formal denuncia, manifestando que tomó conocimiento de una propuesta laboral a través de una publicidad difundida en la red social Instagram de una supuesta empresa llamada Marketing afiliados Golden. Dicha propuesta consistía en la supuesta reventa de productos digitales y operaciones vinculadas a criptomonedas.\nRefiere que, tras contactar con los responsables de la mencionada publicidad, procedió a firmar un contrato digital que se le fue proveído vía WhatsApp por el N°0983788797, en el cual dicho contrato establecía que desempeñaría el puesto de agente de recepción y gestión de pagos. Entre sus responsabilidades principales se encontraba la recepción de fondos provenientes de la venta de productos digitales y su posterior envío a las cuentas bancarias o medios de pago designados por la supuesta empresa.\nEl contrato establecía, entre otras cláusulas, que la denunciante percibiría una comisión equivalente al cinco por ciento (5%) por cada operación de recepción y envío de fondos realizada de manera exitosa; que contaría con flexibilidad horaria para efectuar dichas operaciones, debiendo, no obstante, remitir los fondos en el menor tiempo posible; y que podría desempeñar sus funciones desde cualquier lugar, siempre que contara con acceso a los medios de pago y transferencia indicados por la empresa.\nManifiesta la recurrente que dichas condiciones resultaron de su interés, motivo por el cual aceptó y firmó el contrato, comenzando a prestar tareas desde fecha 13/10/2025.\nLa misma sigue manifestando que contactaba a través de numero de teléfono anteriormente mencionado para proveerle de los datos, comprobantes y operaciones bancarias que obtenía al ofrecer exitosamente los supuestos servicios.\nPosteriormente, en fecha 01/01/2026, la denunciante tomó conocimiento de que las actividades que venía realizando podrían formar parte de una presunta red de estafas, mediante la cual se perjudicaba a terceros interesados en los servicios ofrecidos por la supuesta empresa, advirtiendo que su participación era involuntaria.\nAl tomar conocimiento de dicha situación, la recurrente se negó a continuar prestando servicios para la mencionada empresa y decidió presentarse ante esta Dependencia a fin de radicar la presente denuncia, con el objetivo de deslindar responsabilidades y evitar que su identidad y datos personales continúen siendo utilizados para la comisión de posibles hechos delictivos.\nSe adjuntan el supuesto contrato, el extracto bancario y otras operaciones realizadas por la victima.	CIUDAD DE ASUNCIÓN, GENERAL BRITEZ BORGES CASI CENTENARIO DE LA EPOPEYA NACIONAL 	\N	\N	-2	176	Asunción	Suboficial Ayudante	ALEXIS MIGUEL	AGÜERO GIMÉNEZ	\N	\N	192322A26	\N	borrador	2026-01-02 20:48:57.239853	\N	\N
11	9	2026-01-02	16:34	2026-01-01	17:30	HECHO PUNIBLE A DETERMINAR	\N	Que se presenta ante esta Dependencia Especializada la recurrente, a fin de radicar formal denuncia, manifestando que tomó conocimiento de una propuesta laboral a través de una publicidad difundida en la red social Instagram de una supuesta empresa llamada Marketing afiliados Golden. Dicha propuesta consistía en la supuesta reventa de productos digitales y operaciones vinculadas a criptomonedas.\nRefiere que, tras contactar con los responsables de la mencionada publicidad, procedió a firmar un contrato digital que se le fue proveído vía WhatsApp por el N°0983788797, en el cual dicho contrato establecía que desempeñaría el puesto de agente de recepción y gestión de pagos. Entre sus responsabilidades principales se encontraba la recepción de fondos provenientes de la venta de productos digitales y su posterior envío a las cuentas bancarias o medios de pago designados por la supuesta empresa.\nEl contrato establecía, entre otras cláusulas, que la denunciante percibiría una comisión equivalente al cinco por ciento (5%) por cada operación de recepción y envío de fondos realizada de manera exitosa; que contaría con flexibilidad horaria para efectuar dichas operaciones, debiendo, no obstante, remitir los fondos en el menor tiempo posible; y que podría desempeñar sus funciones desde cualquier lugar, siempre que contara con acceso a los medios de pago y transferencia indicados por la empresa.\nManifiesta la recurrente que dichas condiciones resultaron de su interés, motivo por el cual aceptó y firmó el contrato, comenzando a prestar tareas desde fecha 13/10/2025.\nLa misma sigue manifestando que contactaba a través de numero de teléfono anteriormente mencionado para proveerle de los datos, comprobantes y operaciones bancarias que obtenía al ofrecer exitosamente los supuestos servicios.\nPosteriormente, en fecha 01/01/2026, la denunciante tomó conocimiento de que las actividades que venía realizando podrían formar parte de una presunta red de estafas, mediante la cual se perjudicaba a terceros interesados en los servicios ofrecidos por la supuesta empresa, advirtiendo que su participación era involuntaria.\nAl tomar conocimiento de dicha situación, la recurrente se negó a continuar prestando servicios para la mencionada empresa y decidió presentarse ante esta Dependencia a fin de radicar la presente denuncia, con el objetivo de deslindar responsabilidades y evitar que su identidad y datos personales continúen siendo utilizados para la comisión de posibles hechos delictivos.\nSe adjuntan el supuesto contrato, el extracto bancario y otras operaciones realizadas por la victima.	CIUDAD DE ASUNCIÓN, GENERAL BRITEZ BORGES CASI CENTENARIO DE LA EPOPEYA NACIONAL 	\N	\N	9	176	Asunción	Suboficial Ayudante	ALEXIS MIGUEL	AGÜERO GIMÉNEZ	\N	\N	02E701A26	\N	completada	2026-01-02 20:50:13.075037	\N	\N
12	10	2026-01-02	17:37	2026-01-02	15:48	HECHO PUNIBLE A DETERMINAR	\N	Que, en la fecha y hora mencionadas más arriba, recibe una llamada telefónica del abonado número 0987 417 470, quien manifiesta ser personal de la empresa de telefonía TIGO, solicitándole que proporcione un código que sería enviado vía WhatsApp, supuestamente para la actualización de los servicios. El recurrente proporciona dicho código y, seguidamente, vuelve a recibir una llamada telefónica del abonado número +56 129 934 93, la cual no es respondida.\nMinutos después, su hijo, de nombre Cirilo Antonio Núñez Giménez, con C.I. Nº 5.289.793, le informa que ya había realizado la transferencia que le había sido solicitada vía WhatsApp, la cual fue enviada a la cuenta Nº 8112931183, con cargo al Banco Familiar S.A.E.C.A., registrada a nombre de Laura Carolina Ramos Amarilla, con C.I. Nº 3.906.944, por un importe de 1.200.000 Gs. (un millón doscientos mil guaraníes).\nAsimismo, el recurrente se pone en contacto con otros familiares, quienes también le manifiestan que desde su número telefónico se les estaba solicitando dinero, situación que el recurrente desconoce totalmente, motivo por el cual comparece a poner los hechos en conocimiento de las autoridades competentes.	CIUDAD DE ASUNCIÓN, BARRIO JARA SANTIAGO 1160 C/COMANDANTE MOLAS	\N	\N	-3	182	Asunción	Suboficial Ayudante	GERMAN EMANUEL	RUIZ DÍAZ	\N	\N	C8DB22A26	\N	borrador	2026-01-02 20:55:25.644461	\N	\N
17	12	2026-01-03	08:05	2025-12-31	20:00	HECHO PUNIBLE CONTRA LA PROPIEDAD	\N	EL RECURRENTE MANIFIESTA QUE EN FECHA Y HORA MENCIONADA RECIBIO UN MENSAJE VIA WHATSAPP DESDE EL ABONADO NUMERO +1 226 737-7031 MENCIONANDO LO QUE SERIA SU PRIMA QUE RADICA EN ARGENTINA, SOLICITANDOLE INFORMACION PERSONAL COMO ASI TAMBIEN LA CUENTA PERSONAL DE SU HERMANO RONAL DIAZ CON CI Nº 3195885, PARA RECIBIR UN PAQUETE DEL EXTRANJERO, DONDE EL ACCEDE A ENVIAR DICHOS DATOS YA QUE EL ANONADO NUMERO TELEFONICO TENDRIA LA IMAGEN DE SU PRIMA DE NOMBRE GRICEL BAEL, PASADO LOS DIAZ ESPECIFICAMENTE 02/01/2026 RECIBE UN MENSAJE DEL ABONADO NUMERO +1 829 774 9218 MENCIONANDO QUE YA SE ENCONTRABA SU ENCOMIENDA, EN DHL EN EL AEROPUERTO INTERNACIONAL SILVIO PETTIROSI, LA CUAL SERIA APARATOS CELULARES, PLAY STEINSHON, DRONES COMO ASI TAMBIEN DINERO EN EFECTIVO, EL SEÑOR SE IDENTIFICO COMO EDISON ESTUPIÑAN MENCIONANDOLE QUE SU PAQUETE SERIA RETENIDO POR PERSONAL DE ADUANA, POR EL MOTIVO DE QUE HABRIA SUPERADO EL LIMITE, MANIFESTANDOLE QUE LA MULTA SERIA DE GS. 37.475.460, AL MOMENTO RECIBE UN MENSAJE DESDE EL ABONADO NUMERO +1 249 524 3135 IDENTIFICANDOSE COMO JOSE RICARDO NUÑEZ, EL MISMO SE PRESENTA COMO EL ABOGADO DE LA SEÑORA GRICEL BAEL MANIFESTANDOLE QUE SI NO ABONABA EL 50% DE LA MULTA EL PAQUETE SE DECLARABA COMO ABANDONADA A LO CUAL EL RECURRENTE NO ACCEDIO A REALIZAR EL PAGO. 	CIUDAD DE ASUNCIÓN, TTE. LEONIDAS 4538	\N	\N	12	169	Asunción	Suboficial Ayudante	WALTER DAVID	FRANCO CABRERA	\N	\N	67F47EA26	\N	completada	2026-01-03 11:43:25.407367	\N	\N
18	13	2026-01-03	08:18	2025-01-02	10:30	HECHO PUNIBLE CONTRA LOS BIENES DE LA PERSONA	\N	El recurrente menciona que en fecha y hora mencionada se percata de que se habría realizado varias transacciones sin su consentimiento, específicamente nueve operaciones de 100.000 (cien mil guaraníes) totalizando así la suma de 900.000 (novecientos mil guaraníes), dichas transacciones fueron destinadas al comprobante N°8568002 a nombre de Diego Fleitas Zarate con C.I N° 8168653, el mismo menciona que desconoce quien seria el beneficiario como así también la manera en que se realizo, y en que momento se realizo ya que no recibió ningún tipo de notificación  	CIUDAD DE ASUNCIÓN, COLON Y HUMAITA 	\N	\N	13	195	Asunción	Suboficial Ayudante	ANGEL GABRIEL	CARVALLO FLORENTIN	\N	\N	71213DA26	\N	completada	2026-01-03 11:51:49.518061	\N	\N
19	14	2026-01-03	10:34	2025-12-30	16:31	HECHO PUNIBLE CONTRA LOS BIENES DE LA PERSONA	\N	El recurrente manifiesta que en fecha y hora  mencionada se percata de que su abonado numero telefónico ( 0991601004) fue vulnerado sigue relatando que la persona que realizo el hecho habría solicitado el pago correspondiente de servicio al señor Jovani Konzen  la cual el le manifestó que el pago ya se habría hecho a la cuenta N°6192515406 de la entidad UENO BANCK con C.I: 5976321 a nombre de Edilson Balbino Acosta Gómez la suma de 5.455.800 guaraníes ( cinco millones cuatrocientos cincuenta y cinco mil ochocientos guaraníes ), el mismo menciona que desconoce quien seria el beneficiario, sigue relatando que el mencionado también solicito  dinero a su señora madre de nombre Esmelda Coronel de Peralta, quien por motivos ajenos no pudo realizar ninguna transacción  utilizando los mismos datos de cuenta, razón por la cual procedió al cambio de su lineal telefónica 	DEPARTAMENTO CENTRAL, CIUDAD DE AREGUÁ, MARISCAL LOPEZ CALLE SIN NOMBRE BARRIO SAN MINGUEL	\N	\N	14	195	Asunción	Suboficial Ayudante	ANGEL GABRIEL	CARVALLO FLORENTIN	\N	\N	D4738FA26	\N	completada	2026-01-03 14:19:53.967279	\N	\N
20	15	2026-01-05	09:08	2025-06-02	16:47		\N	El dia y la fecha mencionada mas arriba la denunciante manifiesta haber hecho dos transferencias de forma erronea a la cuenta Nº 800001648 Titular Gino Paolo Cagnoli Rusconi a cargo del Banco ITAU monto 2.000.000 y 490.000 respectivamente seguidamente se puso en comunicacion con su Banco para informar lo acontecido, pero no le fue proporcionado ningun dato a fin de contactarse con la persona y hasta el dia de la fecha no recibio retorno por las opeciones realizadas por lo que se presenta a esta dependecia policial a realizar su denuncia para los fines correspondiente.	DEPARTAMENTO CENTRAL	\N	\N	-6	190	Asunción	Suboficial Ayudante	MATIAS SEBASTIAN	SOSA ALVAREZ	\N	\N	60B3D3A26	\N	borrador	2026-01-05 12:19:54.51606	\N	\N
21	15	2026-01-05	09:08	2025-06-02	16:47		\N	El dia y la fecha mencionada mas arriba la denunciante manifiesta haber hecho dos transferencias de forma erronea a la cuenta Nº 800001648 Titular Gino Paolo Cagnoli Rusconi a cargo del Banco ITAU monto 2.000.000 y 490.000 respectivamente seguidamente se puso en comunicacion con su Banco para informar lo acontecido, pero no le fue proporcionado ningun dato a fin de contactarse con la persona y hasta el dia de la fecha no recibio retorno por las opeciones realizadas por lo que se presenta a esta dependecia policial a realizar su denuncia para los fines correspondiente.	DEPARTAMENTO CENTRAL	\N	\N	-7	190	Asunción	Suboficial Ayudante	MATIAS SEBASTIAN	SOSA ALVAREZ	\N	\N	A2336DA26	\N	borrador	2026-01-05 12:24:00.093314	\N	\N
22	15	2026-01-05	09:08	2025-06-02	16:47		\N	El dia y la fecha mencionada mas arriba la denunciante manifiesta haber hecho dos transferencias de forma erronea a la cuenta Nº 800001648 Titular Gino Paolo Cagnoli Rusconi a cargo del Banco ITAU monto 2.000.000 y 490.000 respectivamente seguidamente se puso en comunicacion con su Banco para informar lo acontecido, pero no le fue proporcionado ningun dato a fin de contactarse con la persona y hasta el dia de la fecha no recibio retorno por las opeciones realizadas por lo que se presenta a esta dependecia policial a realizar su denuncia para los fines correspondiente.	DEPARTAMENTO CENTRAL	\N	\N	15	190	Asunción	Suboficial Ayudante	MATIAS SEBASTIAN	SOSA ALVAREZ	\N	\N	EE71C2A26	\N	completada	2026-01-05 12:24:19.600599	\N	\N
23	16	2026-01-05	09:04	2025-12-02	13:54	HECHO PUNIBLE CONTRA EL PATRIMONIO	\N	Que, se presenta ante esta Dependencia Especializada a fin de formular una denuncia sobre un supuesto hecho ocurrido en fecha 02 de diciembre de 2025, el mismo refiere que en la mencionada fecha se encontraba trabajando en la ciudad de Málaga - España, en ese lapso solicita a un grupo de WhatsApp información sobre alquileres de vehículos, minutos después una persona con abonado 0983096522 le escribe en la mensajería instantánea de WhatsApp identificándose como Richard González, supuesto asesor de ventas de la Empresa "Rent a Car Blue Paraguay, ubicado en la sede aeroportuaria del Aeropuerto Internacional Silvio Pettirossi  de la Ciudad de Asunción, subsiguientemente la persona le facilita los datos de un vehículo de la marca Toyota, modelo Fortuner 2023, N° de Chasis MALAM51BACM5868487, con matrícula N° AAJZ 113 y a la vez le manifiesta que el alquiler de tal rodado correspondería a la suma de guaraníes 4.200.000 y que para poder alquilar se tenia que cumplir con el sesenta porciento del pago, para tal efecto la persona le facilita una cuenta bancaria N° 619383011 con cargo Banco UENO BANK S.A a nombre de Gustavo Ramón MartÍnez Aguilera con C.I N° 6561993, el denunciante pensando que se trataba de una persona honesta, responsable y ecuánime acepta todos los términos y condiciones propuestos por el individuo y en fechas 06/12/2025, 9/12/2025, siendo las 10:09 A.M y 16:22 P.M efectúo dos transferencias a la cuenta bancaria de Gustavo Ramón Martínez Aguilera por el valor total de guaraníes 2.400.000 (dos millones cuatrocientos mil de guaraníes), dicho procedimiento de transferencia lo realizó desde Monty Global Pyments (Empresa Tecnológica en Servicio de envío de dinero internacional) estando en la ciudad de Málaga. En fecha 11/12/2025 la persona le envía una fotografía de un supuesto contrato de arrendamiento entre el señor Eduardo Nicolás Ferreira Giménez con C.I N° 862029 (Arrendador del vehículo en mención) y el denunciante, en tal acto jurídico se observa la celebración de un contrato privado de arrendamiento que se regirá por 7 cláusulas, ulteriormente la persona le indica que una vez arribado al aeropuerto internacional iba a poder retirar el vehículo sin ningún inconveniente, específicamente en fecha 26/12/2025 hasta el 26/02/2026 conforme al supuesto contrato de arrendamiento, seguidamente el señor Richard González le solicita la cancelación total del alquiler para poder finiquitar los detalles del contrato, debido a ciertas anomalías que surgió durante la conversación se percató que las personas detalladas más arriba no pertenecían a la empresa ut supra mencionada y que no existía ningún contrato de arrendamiento, por lo que deduce que fue víctima de un supuesto hecho de estafa, además asevera que en el transcurso de los días acercará hasta el Ministerio Público todos los elementos materiales probatorios que pueda ayudar a conducir a su comprobación y calificación legal.\nSe adjunta a la presente denuncia las capturas de pantallas de todas las conversaciones que tuvo con la persona.\n	DEPARTAMENTO CENTRAL, CIUDAD DE VILLA ELISA, SOBRE LA CALLE GUAVIJÚ 124 BARRIO TRES BOCAS CIUDAD DE VILLA ELISA	\N	\N	16	168	Asunción	Suboficial Ayudante	MARICELA 	PEREIRA GONZÁLEZ	\N	\N	9E962CA26	\N	completada	2026-01-05 13:50:12.930037	\N	\N
26	17	2026-01-05	11:31	2026-01-03	00:00	OTRO	AMENAZA Y EXTORSION 	La denunciante manifiesta que, hace aproximadamente dos años atrás, en el año 2024 conoció a una persona a través de la aplicación de la red social Facebook, y esta persona de sexo masculino de nombre JOSE GRACIANO, de profesión Medico Cirujano, todos estos datos son proveídos mediante relato de la denunciante; en ese entonces la denunciante y el supuesto JOSE GRACIANO mantuvieron una relacion amorosa y sexual, con la condición de que el supuesto JOSE le ayudaría económicamente, dicho encuentro intimo ocurrió en motel del barrio San Pablo, dicho acto ocurrió con el consentimiento de ambos, pero no así la filmación de dicho acto sexual, donde la denunciante se percata que fue filmada por el supuesto JOSE, luego de varios días este sujeto le envía por medio de un mensaje vía WhatsApp dicho contenido sexual desde el abonado numero 0991335549, la misma al enterarse del video le solicita al señor JOSE que elimine esos videos, el supuesto JOSE no responde dicho mensaje y se llama a silencio por un buen tiempo, transcurrido los años vuelve a aparecer con la misma propuesta de tener relaciones sexuales a cambio de una ayuda económica y dicho mensaje de texto vía mensajería de WhatsApp se da en fecha sábado 03/01/2026 desde el numero 0991335549, los mensajes relacionados a la propuesta de estar con el señor JOSE es negada por la denunciante por lo que el sujeto mencionado anteriormente  la amenaza y la extorsiona con publicar dicho video en las redes sociales y manifestar o hacer publico que la denunciante seria una trabajadora sexual (prostituta), la denunciante manifiesta temer por su vida y niega totalmente toda acusación en su contra que este JOSE pudiera hacer o manifestar.	CIUDAD DE ASUNCIÓN, ESTANDO EN SU DOMICILIO	\N	\N	19	202	Asunción	Suboficial Ayudante	DERLIS THOMAS	CONCHA PIRIS	\N	\N	3C0A25A26	\N	completada	2026-01-05 15:26:18.989838	\N	\N
27	18	2026-01-05	11:44	2026-01-02	20:00	HECHO PUNIBLE A DETERMINAR	\N	Que, se presenta ante esta Dependencia Especializada a fin de formular una Denuncia sobre un supuesto hecho ocurrido el día 02/01/2026, el mismo refiere que en la mencionada fecha se encontraba en su domicilo particular, sito sobre la calle Concejal Godoy casi Venezuela, Barrio Espiritu Santo de la Ciudad de San Lorenzo, en ese interin intenta ingresar a su banca web del Banco Familiar percatandose de que el pin de acceso estaba inactivo, atonito por lo observado rapidamente procede a llamar a los funcionarios de dicha entidad a fin de poder obtener una respuesta factible de lo que estaba aconteciendo, siendo atendida por una funcionaria quien le indico para hacercarse el dia 03/01/2026, en tal fecha se apersono hasta la sucursal del Banco Familiar ubicado en el predio de Fuente Shoping de la Ciudad de San Lorenzo, una vez en el lugar fue atendidio por un funcionario quien con toda celeridad le manifiesta sobre la existencia de una denuncia en su contra por el supuesto Hecho Punible de ESTAFA y que a consecuencia de tal hecho se procedio a bloquear su Cuenta Bancaria del Banco Familiar, ademas le explica que el factor detonante de todos los hechos que estaba acaeciendo se debio a que el mismo posee una cuenta Bancaria en Tú Financiera, anonadado por lo escuchado y a la vez indignado por el acto irregular que estaba precenciando, se constituyo el dia de la fecha 05/01/2026 hasta la Casa Central de Tu Financiera, ubicado sobre la calle Teresa Lamas Esq. Capitan Roman, destras mismo del Shoping Multiplaza de la Ciudad de Asunción, en el lugar fue recibido por una funcionaria a quien le explico lo sucedido, la misma le confirma con toda certeza y exactitud que el recurrente posee una cuenta bancaria con la entidad Tú Financiera con Nº de Cuenta 20027268 correspondiente a  una Billetera Mango, aseverandole que en fecha 16/10/2025 se realizó un prestamo de 800.000 guaranies, asi mismo recibio 8 transferencias en cuenta bancaria en cuestion por  el valor total de guaranies 9.200.000(nueve millones doscientos mil guaranies), las cuales fueron   enviadas a otra cuentas desconocidas con fecha de operación 16/10/2025, 05/11/2025, 21/11/2025, 22/12/2025, 23/12/2025 y 29/12/2025, posteriormente la funcionaria le comenta que para la creacion de la cuenta bancaria en mencion se  utilizo la foto de su cedula de identad civil y una fotografia que no le correponde de ninguna forma, tal procedimiento de creacion se concreto a traves de la aplicacion de la Billetera Mango-Tú Financiera. \nSigue manifestando el afectado que la cuenta de Billetera Mango con Nº de Cuenta 20027268, con alias 0982015452 no fue solicitado por su persona en ningun momenrto determinado por lo que responsabiliza del hecho ilicito a los directivos de Tú Financiera S.A.E.C.A al no corroborar u avisar en tiempo y en forma sobre la supuesta existencia de dicha cuenta y deuda de 800.000 guaranies, por ende, exige a los directivios la dilucidacion inmediata del hecho delictuoso nombrado mas arriba. \nSe adjunta en la presente denuncia copia simple del extracto de cuenta, donde se detalla a por menorizado todas las transacciones interbancarias y prestamo efectuado de forma irregular y desconocida.     	DEPARTAMENTO CENTRAL, CIUDAD DE SAN LORENZO, SOBRE LA CALLE CONCEJAL GODOY CASI VENEZUELA, BARRIO ESPIRITU SANTO DE LA CIUDAD DE SAN LORENZO A TRES CUADRAS DEL SUPERMERCADO STOCK	\N	\N	20	203	Asunción	Suboficial Ayudante	PEDRO LUIS	MARTINEZ VEGA	\N	\N	59EED1A26	\N	completada	2026-01-05 16:08:58.323298	\N	\N
28	19	2026-01-05	12:32	2026-01-03	08:30	OTRO	ESTAFA	El mismo manifiesta que, queriendo adquirir un electrodoméstico ( ventilador de techo), se puso a buscar en redes sociales específicamente en la red social de Facebook, donde visualiza en una pagina con el nombre de TODO HOGAR con enlace https://www.facebook.com/share/17patYwjEX/,  y se ponen en contacto para poder concretar dicha compra y venta del ventilador de techo, el sujeto se identifica como EDGAR RIVEROS asesor de ventas de la empresa TODO HOGAR, facilitando su número de celular 0985225011 y cuenta Bancaria de la entidad de BANCO ATLAS ALIAS: CI 6777798 NUMERO DE CUENTA: 1755902 del BANCO ATLAS, el denunciante procede a realizar dicha transferencia a la cuenta mencionada por el valor de 350.000 gs (trescientos cincuenta mil guaraníes) luego de dicha transferencia, acordaron que para la entrega del producto se estaría comunicando con el denunciante un supuesto delivery desde el abonado numero 0991649406, el delivery le indica que el costo del servicio alcanza la suma de gs 50.000( cincuenta mil guaraníes), donde le denunciante procede a realizar un giros Tigo al numero 0985870475 proveído por el supuesto delivery, luego el supuesto delivery se pone en contacto vía llamada telefónica con el afectado y le manifiesta que fue detenido por la patrulla caminera y que para poder ser liberado le solicitan la suma de 100.000 gs (cien mil guaraníes), a lo que el denunciante le manifiesta que solo tiene la suma de 42.000 gs(cuarenta y dos mil guaraníes), donde el supuesto delivery acepta de igual manera esa suma y el denunciante procede nuevamente al enviar vía giros Tigo  al numero 0985870475, posterior al envió el numero del supuesto delivery ya no responde por lo que el denunciante se percata de que fue victima de una estafa ya que hasta la fecha no le fue entregado ningún electrométrico y tampoco obtiene respuesta alguna sobre todo lo acordado. 	DEPARTAMENTO CENTRAL, CIUDAD DE AREGUÁ, ESTANDO EN SU DOMICILIO	\N	\N	21	202	Asunción	Suboficial Ayudante	DERLIS THOMAS	CONCHA PIRIS	\N	\N	376FB3A26	\N	completada	2026-01-05 16:28:54.230949	\N	\N
29	20	2026-01-05	14:32	2025-05-01	00:00	HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA	\N	Que se presenta a esta dependencia policial a fin de realizar una denuncia sobre el hecho punible mas detallado arriba y relata cuanto sigue que aproximandamente desde el mes de mayo recibe mensajes en sus redes sociales de perfiles desconocidos los cuales de forma ostil invita a salir a la recurrente de lo contrario publicaria fotos intimas que desde el perfil hacen entender que son de la recurrente, asi tambien este tipo de propuesta se repitieron en varias ocasiones en distintas redes sociales y perfiles, cuyos enlaces desconoce en su mayoria y detalla uno de los perfiles los cuales repitio la misma conducta en los dias recientes, https://www.facebook.com/share/1BAj2zN1xY/ . La misma sospecha de una persona con la cual tuvo un relacionamiento en los meses anteriores a que comience a recibir estos mensajes, cuya identidad la misma prefiere no describir, tambien manifiesta que cuenta con capturas de pantallas de los mensajes recibidos, por lo que viene a poner a conocimiento para los fines que hubiere lugar. 	DEPARTAMENTO CENTRAL, CIUDAD DE ÑEMBY	\N	\N	22	204	Asunción	Suboficial Ayudante	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	\N	\N	1D2865A26	\N	completada	2026-01-05 18:14:37.006387	\N	\N
30	21	2026-01-05	15:23	2025-11-28	10:56	OTRO	TRANSACCION ERRÓNEA 	EL DIA Y LA FECHA INDICADA MAS ARRIBA EL MISMO REALIZO UNA TRANSFERENCIA A LA CUENTA Nº 619177937, TITULAR ADRIAN GUSTAVO BARRETO BURGOS, A CARGO DE UENO BANK, EL MONTO DE 500.000 GS (QUINIENTOS MIL GUARANIES), ACTO SEGUIDO SE PONE EN CONTACTO CON LA ENTIDAD FINANCIERA PARA INFORMAR LO ACONTECIDO, DESDE ESA ENTIDAD  LE MANIFIESTAN QUE SE PONDRIAN EN CONTACTO CON EL TITULAR DE LA CUENTA DE DESTINO Y LE SOLICITAN AL RECURRENTE UN MES DE TIEMPO A FIN DE TRATAR DE REGULARIZAR LA DEVOLUCION, PERO HASTA EL DIA DE LA FECHA NO LE HAN DADO RETORNO, POR LO QUE SE PRESENTA A ESTA DEPENDENCIA POLICIAL PARA LOS FIBNES QUE DIERE LUGAR.	CIUDAD DE ASUNCIÓN	\N	\N	23	204	Asunción	Suboficial Ayudante	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	\N	\N	AAC23CA26	\N	completada	2026-01-05 18:37:31.153165	\N	\N
31	22	2026-01-05	15:40	2025-12-23	12:00	EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS	\N	SE PRESENTA A ESTA DEPENDENCIA A FIN DE FORMULAR UNA DENUNCIA DE EXTRAVIO DE UNA HOJA DE CHEQUE DEL CUAL EL MISMO ERA PORTADOR EN CIRCUNSTACIAS QUE DESCONOCE Y CUYOS DATOS SE DETALLAN ACONTINUACION : \nCHEQUE Nº 24658645, CUENTA CORRIENTE Nº 16-00373730, TITULAR EMPRENDIMIENTOS KV S.A, A CARGO DEL BANCO FAMILIAR, MONTO 15.058.521 GS (QUINCE MILLONES CINCUENTA Y OCHO MIL QUINIENTOS VEINTI UN GUARANIES)\n	CIUDAD DE ASUNCIÓN, RIO YPANE	\N	\N	24	204	Asunción	Suboficial Ayudante	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	\N	\N	D25DD4A26	\N	completada	2026-01-05 18:51:34.847594	\N	\N
32	23	2026-01-05	15:54	2025-12-17	17:00	EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS	\N	SE PRESENTA ANTE ESTA DEPENDENCIA A FIN DE FORMULAR UNA DENUNCIA SOBRE EL EXTRAVIO DE DOS HOJAS DE FACTURA CUYOS DATOS SE DETALLAN ACONTINUACION :\nTITULAR: EXELENT S.A., FACTURA Nº 0004104, RUC Nº 80030026-2, CON TIMBRADO Nº 18252283\nTITULAR: EXELENT S.A., FACTURA Nº 0004105, RUC Nº 80030026-2, CON TIMBRADO Nº 18252283\n	CIUDAD DE ASUNCIÓN	\N	\N	25	204	Asunción	Suboficial Ayudante	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	\N	\N	94A8CDA26	\N	completada	2026-01-05 19:02:42.75285	\N	\N
33	24	2026-01-05	14:48	2026-01-05	13:30	HECHO PUNIBLE A DETERMINAR	\N	Que, se presenta ante esta Dependencia Especializada a fin de formular una Denuncia sobre un supuesto hecho ocurrido el día 05/01/2026, la misma refiere que en la mencionada fecha se encontraba  en la UNIDA (UNIVERSIDAD DE LA INTERGRACION DE LAS AMERICAS), sito sobre la calle Venezuela casi Nicasio Insaurralde de la Ciudad de Asunción, en ese ínterin recibió una llamada telefónica de parte de una persona con abonado N° 0994507371, identificándose como un supuesto funcionario del banco Itaú y a la vez mencionándole que tiene una tarjeta de Crédito  que supuestamente la misma había solicitado a través de la app de Itaú, estupefacta por lo escuchado la afectada le responde con toda celeridad que en ningún momento solicito dicha tarjeta y que por ende desconoce el trasfondo de la llamada, por tal razón le solicita la anulación definitiva de dicha tarjeta indicándole que ella misma se iba a poner en contacto con su oficial de cuenta para poder analizar y dilucidar tal acontecimiento irregular, minutos después una persona con abonado N° +18607994903 procedió a llamarle de forma constante y debido a la rareza de la llamada decidió omitirlo y por consiguiente a bloquearle, segundos después la recurrente intenta ingresar a su cuenta de WhatsApp constatando de que la misma fue vulnerada totalmente por personas desconocidas, inescrupulosas y nefastas, motivo por el cual se apersona ante esta Sede Policial para dejar asentado sus manifestaciones pertinentes deslindándose de toda responsabilidad civil y penal que le pueda acarrear tal situación ilícita, recalcando que una vez que  se apoderaron de su cuenta de WhatsApp empezaron a solicitar a todos sus contactos transferencias de dinero en nombre de la misma.\nSigue relatando que teme que se pueda utilizar sus datos personales y confidenciales para la perpetración de hechos delictuosos relativo a la Estafa.\n\n	CIUDAD DE ASUNCIÓN, EN LA UNIVERSIDAD UNIDA (UNIVERSIDAD DE LA INTERGRACION DE LAS AMERICAS), UBICADO SOBRE LA CALLE VENEZUELA CASI NICASIO INSAURRALDE DE LA CIUDAD DE ASUNCION, EN FRENTE MISMO DEL INERAN	\N	\N	26	203	Asunción	Suboficial Ayudante	PEDRO LUIS	MARTINEZ VEGA	\N	\N	105846A26	\N	completada	2026-01-05 19:05:01.172463	\N	\N
34	25	2026-01-05	16:24	2026-01-02	11:44	OTRO		La misma manifiesta que, es cliente de la entidad bancaria Banco Continental con cuenta Nº 010013958806, y en fecha 02/01/2026 siendo las 11:44 hs A.M, la denunciante queriendo realizar un pago por servicio de un credito a la entidad bancaria de TU FINANCIERA S.A, realiza una transferencia por el valor de guaranies 1.132.196 GS (un millon ciento treinta y dos mil ciento noventa y seis mil guaranies), al realizar dicha transferencia la misma se percata que envìo el dinero erròneamente a otra cuenta bancaria y se percata de dicho error involuntario, la suma de guaranies mencionada anteriormente que fuera enviada erròneamente fue a parar a la cuenta del Señor HEBER MARCIAL ARIAS ROMERO CON C.I Nº 4.426.604 con cuenta Nº 21184367 cargo banco TU FINANCIERA S.A., la misma realiza la denuncia para los fines que hubiere lugar.\n\n 	CIUDAD DE ASUNCIÓN, ESTANDO EN SU DOMICILIO	\N	\N	27	204	Asunción	Suboficial Ayudante	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	\N	\N	FA5A16A26	\N	completada	2026-01-05 19:55:52.142456	\N	\N
35	26	2026-01-05	17:49	2025-12-31	13:56	OTRO		El mismo manifiesta que en fecha 31/12/2025 recibe un mensaje vía WhatsApp desde el celular N° 0981 246 690, que seria el numero de su padre el señor VICTOR GONZA ALEZ, en dichos mensajes vía WhatsApp le solicita dinero ya que estaría necesitando y el denunciante quien es su hijo no duda en realizar la transferencia a pedido de su padre, dicha transferencia fue realizada a la cuenta N° 81-6855145, A cargo del Banco Familiar ( CUENTA EKO), a nombre de MARIA ASUNCION ENCISO FERNANDEZ, N° de comprobante 79354938, por el valor de 350.000 GS ( trecientos cincuenta mil guaraníes), posteriormente tras realizar el primer envió minutos después le vuelve a solicitar la misma cantidad a la misma cuenta, totalizando así la suma de 700.000 GS (Setecientos mil guaraníes), comprobante N° de la segunda transferencia 79352164, sigue manifestando el recurrente que dicho pedido de dinero por parte de quien seria su padre no le fue extraño, en horas de la tarde el denunciante se percata que su padre habría sufrido una vulneración en su cuenta de mensajería instantánea WhatsApp ya que visualiza el estado de su padre que da aviso que desde su cuenta de WhatsApp se estaba pidiendo dinero ya que fue victima de un hackeo, por todo lo acontecido el mismo viene a poner a conocimiento de la autoridad competente	DEPARTAMENTO CENTRAL, CIUDAD DE LAMBARÉ, PUERTO PABLA 	\N	\N	28	204	Asunción	Suboficial Ayudante	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	\N	\N	704CF3A26	\N	completada	2026-01-05 21:14:15.415653	\N	\N
39	32	2026-01-05	23:08	2026-01-01	09:19	Daño con fines de estafa de seguro	\N	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus aliquam condimentum odio. Ut feugiat condimentum congue. Donec venenatis laoreet ante eget congue. Mauris ut dapibus mi, eget blandit enim. Vivamus faucibus ipsum odio, in finibus lorem suscipit dapibus. Vivamus at lorem malesuada odio ornare sollicitudin. Maecenas justo lectus, ultricies quis purus id, finibus dignissim nisl. Fusce purus nibh, pharetra non sem ut, maximus maximus ex. Donec sit amet tortor est. Nulla elementum magna ac diam pellentesque, eu aliquam tortor condimentum. Donec sem ante, fringilla eu molestie nec, convallis ut est.\nSed sem eros, semper ac tincidunt id, feugiat eget enim. Morbi tempor magna ut orci euismod vestibulum. Nunc in sapien sit amet dolor tincidunt placerat id nec turpis. Suspendisse imperdiet, urna vitae commodo feugiat, quam urna commodo justo, eget aliquet sapien felis id velit. Phasellus sed orci ligula. Morbi venenatis lectus ac dolor dictum interdum. Proin eleifend nibh nec congue vulputate. Donec sapien purus, blandit quis ultrices eget, ornare ut quam. Aliquam erat volutpat. Nunc sagittis sem at enim placerat feugiat. Pellentesque ipsum sapien, imperdiet in arcu quis, tempus feugiat nisl.\nPraesent id ex ultrices, viverra nisl tincidunt, lobortis neque. Maecenas rhoncus augue sed nisl mattis placerat. Fusce porta tristique ex nec sagittis. Suspendisse mi ex, molestie et commodo vitae, interdum quis sem. Cras sodales orci sit amet orci volutpat, sit amet iaculis augue aliquam. Morbi hendrerit ligula at ipsum placerat, a faucibus urna congue. Duis fringilla, justo tristique molestie vehicula, sem lectus aliquam leo, vitae ornare lorem odio ut purus. Aenean pharetra iaculis mi, vitae viverra turpis facilisis quis. Praesent tristique convallis vehicula. Curabitur id ex eu leo finibus aliquam. Sed ultricies lorem justo, sed iaculis nunc rutrum in. Curabitur tristique mauris et lectus elementum, in accumsan lorem sodales. Ut finibus, tellus nec sollicitudin efficitur, enim mi ultrices turpis, eget imperdiet tellus massa ac lorem. Donec id pellentesque mauris. In in velit sed lacus gravida tincidunt. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\nSed quis cursus metus. Vestibulum faucibus aliquet enim, sed gravida ante ornare vel. Nulla dapibus enim eu dictum imperdiet. Mauris eu magna ut turpis ornare suscipit in eget justo. Pellentesque a tortor vel diam euismod ornare sed non purus. Donec volutpat, nulla non vehicula pretium, est enim rhoncus libero, sed porta magna ligula eget purus. Duis congue purus a arcu porttitor venenatis. Integer pharetra elementum lacus, at malesuada nulla aliquam eu. Donec pellentesque vestibulum est. Proin consequat diam et neque maximus, in tincidunt orci vehicula. Maecenas placerat bibendum ligula, sit amet iaculis metus consectetur placerat. Proin id pretium dui. Etiam enim massa, tempor et quam a, ornare aliquam nisi. Integer at arcu ut sem luctus varius sit amet eu sapien.		\N	\N	17	220	Asunción	Oficial Segundo	usuario	prueba	\N	\N	6890C8A26	\N	completada	2026-01-06 02:09:11.718139	\N	\N
\.


--
-- Data for Name: denuncias_involucrados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.denuncias_involucrados (id, denuncia_id, denunciante_id, rol, representa_denunciante_id, creado_en, con_carta_poder, carta_poder_fecha, carta_poder_numero, carta_poder_notario) FROM stdin;
1	1	1	principal	\N	2026-01-02 13:18:50.691126	f	\N	\N	\N
2	2	2	principal	\N	2026-01-02 14:46:32.749971	f	\N	\N	\N
3	3	3	principal	\N	2026-01-02 15:02:57.266616	f	\N	\N	\N
4	4	4	principal	\N	2026-01-02 16:19:52.85745	f	\N	\N	\N
5	5	5	principal	\N	2026-01-02 16:24:03.157437	f	\N	\N	\N
6	6	5	principal	\N	2026-01-02 16:29:36.511236	f	\N	\N	\N
7	7	6	principal	\N	2026-01-02 18:38:20.729697	f	\N	\N	\N
8	8	7	principal	\N	2026-01-02 18:54:28.045619	f	\N	\N	\N
9	9	8	principal	\N	2026-01-02 19:49:16.967595	f	\N	\N	\N
10	10	9	principal	\N	2026-01-02 20:48:57.239853	f	\N	\N	\N
11	11	9	principal	\N	2026-01-02 20:50:13.075037	f	\N	\N	\N
12	12	10	principal	\N	2026-01-02 20:55:25.644461	f	\N	\N	\N
14	13	10	principal	\N	2026-01-02 21:01:03.515065	f	\N	\N	\N
15	14	11	principal	\N	2026-01-02 21:18:55.388311	f	\N	\N	\N
17	15	11	principal	\N	2026-01-02 21:20:43.969335	f	\N	\N	\N
18	16	11	principal	\N	2026-01-02 21:20:53.236165	f	\N	\N	\N
19	17	12	principal	\N	2026-01-03 11:43:25.407367	f	\N	\N	\N
20	18	13	principal	\N	2026-01-03 11:51:49.518061	f	\N	\N	\N
21	19	14	principal	\N	2026-01-03 14:19:53.967279	f	\N	\N	\N
22	20	15	principal	\N	2026-01-05 12:19:54.51606	f	\N	\N	\N
23	21	15	principal	\N	2026-01-05 12:24:00.093314	f	\N	\N	\N
25	22	15	principal	\N	2026-01-05 12:26:19.08668	f	\N	\N	\N
26	23	16	principal	\N	2026-01-05 13:50:12.930037	f	\N	\N	\N
29	26	17	principal	\N	2026-01-05 15:26:18.989838	f	\N	\N	\N
30	27	18	principal	\N	2026-01-05 16:08:58.323298	f	\N	\N	\N
31	28	19	principal	\N	2026-01-05 16:28:54.230949	f	\N	\N	\N
32	29	20	principal	\N	2026-01-05 18:14:37.006387	f	\N	\N	\N
33	30	21	principal	\N	2026-01-05 18:37:31.153165	f	\N	\N	\N
34	31	22	principal	\N	2026-01-05 18:51:34.847594	f	\N	\N	\N
35	32	23	principal	\N	2026-01-05 19:02:42.75285	f	\N	\N	\N
36	33	24	principal	\N	2026-01-05 19:05:01.172463	f	\N	\N	\N
37	34	25	principal	\N	2026-01-05 19:55:52.142456	f	\N	\N	\N
38	35	26	principal	\N	2026-01-05 21:14:15.415653	f	\N	\N	\N
41	39	32	principal	\N	2026-01-06 02:09:11.718139	f	\N	\N	\N
\.


--
-- Data for Name: dispositivos_autorizados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dispositivos_autorizados (id, fingerprint, user_agent, ip_address, codigo_activacion_id, autorizado_en, ultimo_acceso, activo, nombre) FROM stdin;
2	a08c95d7741f0b52d4fb8a19ee2f0217bce302fd8d3406733217c0ec81789b1a	Mozilla/5.0 (Android 15; Mobile; rv:146.0) Gecko/146.0 Firefox/146.0	186.158.200.183	12	2026-01-01 13:02:39.030584	2026-01-02 17:58:54.506769	t	365
1	bf04b646a4b3d1c55f0cce511ad67664a6c319e96c535ee28110c9938cda12ff	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0	181.91.85.248	9	2026-01-01 02:44:36.773259	2026-01-01 04:21:03.457732	t	BARB
3	62d18984722ed057781bce4342a009271fd0bf4799981a048ca348f09af03584	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	186.158.200.1	14	2026-01-01 13:09:43.41448	2026-01-01 13:09:43.41448	t	PC2-ASU
\.


--
-- Data for Name: historial_denuncias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historial_denuncias (id, nombre_denunciante, cedula_denunciante, operador, fecha_denuncia, hora_denuncia, numero_orden, tipo_hecho, hash_denuncia, creado_en) FROM stdin;
1	BRUNO ANDRES RODRIGUEZ ESCURRA	4849995	Oficial Ayudante MATIAS RAMÓN ORTIGOZA GÓMEZ	2026-01-02	09:53	1	OTRO	E591BCA26	2026-01-02 13:18:50.691126
2	OSVALDO AMADO FERRIRA COLNAGO	2376669	Oficial Ayudante MARÍA SOLEDAD MIRANDA AMARILLA	2026-01-02	11:26	2	HECHO PUNIBLE CONTRA LOS BIENES DE LA PERSONA	03CB57A26	2026-01-02 14:46:32.749971
3	JUAN JOSE MARTINEZ	5376972	Suboficial Segundo ROMINA GISELL SÁNCHEZ SABABRIA	2026-01-02	11:42	3	HECHO PUNIBLE CONTRA EL PATRIMONIO	6298DDA26	2026-01-02 15:02:57.266616
4	PATRICIA CAROLINA SERVIN RODRIGUEZ	6165172	Suboficial Ayudante FATIMA BERNAL FARIÑA	2026-01-02	12:58	4	EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS	75C1E9A26	2026-01-02 16:19:52.85745
5	CARLOS ARIEL RAMIEZ BOBADILLA 	3913369	Oficial Ayudante MATIAS RAMÓN ORTIGOZA GÓMEZ	2026-01-02	12:29	5	HECHO PUNIBLE CONTRA EL PATRIMONIO	AD3A5EA26	2026-01-02 16:29:36.511236
6	SERGIO DANIEL VILLALBA DOMINGUEZ	4976567	Suboficial Ayudante AXEL FERNANDO DUARTE ORTIGOZA	2026-01-02	13:27	6	HECHO PUNIBLE A DETERMINAR	B9AFC9A26	2026-01-02 18:38:20.729697
7	CATALINA MONTES ALVEAR	5419700	Suboficial Ayudante GERMAN EMANUEL RUIZ DÍAZ	2026-01-02	15:00	7	HECHO PUNIBLE CONTRA EL PATRIMONIO	831C80A26	2026-01-02 18:54:28.045619
8	ANDRES DANIEL CHAMORRO RUIZ DIAZ	2447085	Suboficial Ayudante AXEL FERNANDO DUARTE ORTIGOZA	2026-01-02	16:10	8	OTRO	0EF8B6A26	2026-01-02 19:49:16.967595
9	SOPHIA CAMILA ROXANA MEZA SEGOVIA 	6141681	Suboficial Ayudante ALEXIS MIGUEL AGÜERO GIMÉNEZ	2026-01-02	16:34	9	HECHO PUNIBLE A DETERMINAR	02E701A26	2026-01-02 20:50:13.075037
10	OSCAR ANTONIO NUÑEZ GODOY	462632	Suboficial Ayudante GERMAN EMANUEL RUIZ DÍAZ	2026-01-02	17:37	10	HECHO PUNIBLE A DETERMINAR	263D1DA26	2026-01-02 21:01:03.515065
11	CIRILO ANTONIO NUÑEZ GIMENEZ	5289793	Oficial Ayudante MARÍA SOLEDAD MIRANDA AMARILLA	2026-01-02	18:06	11	HECHO PUNIBLE A DETERMINAR	3A2FFEA26	2026-01-02 21:20:53.236165
12	FERNANDO JAVIER DIAZ TORRES	3195926	Suboficial Ayudante WALTER DAVID FRANCO CABRERA	2026-01-03	08:05	12	HECHO PUNIBLE CONTRA LA PROPIEDAD	67F47EA26	2026-01-03 11:43:25.407367
13	RICHARD MANUEL CACERES CABAÑAS	3274986	Suboficial Ayudante ANGEL GABRIEL CARVALLO FLORENTIN	2026-01-03	08:18	13	HECHO PUNIBLE CONTRA LOS BIENES DE LA PERSONA	71213DA26	2026-01-03 11:51:49.518061
14	OSMAE ARIEL PERALTA CORONEL	3498796	Suboficial Ayudante ANGEL GABRIEL CARVALLO FLORENTIN	2026-01-03	10:34	14	HECHO PUNIBLE CONTRA LOS BIENES DE LA PERSONA	D4738FA26	2026-01-03 14:19:53.967279
15	RUTH NOEMI MARTINEZ LOCIO	3499152	Suboficial Ayudante MATIAS SEBASTIAN SOSA ALVAREZ	2026-01-05	09:08	15		EE71C2A26	2026-01-05 12:26:19.08668
16	CARLOS ANIBAL GONZÁLEZ ALEGRE	1202955	Suboficial Ayudante MARICELA  PEREIRA GONZÁLEZ	2026-01-05	09:04	16	HECHO PUNIBLE CONTRA EL PATRIMONIO	9E962CA26	2026-01-05 13:50:12.930037
17	CARLOS ANIBAL GONZÁLEZ ALEGRE	1202955	Suboficial Ayudante MARICELA  PEREIRA GONZÁLEZ	2026-01-05	09:04	17	HECHO PUNIBLE CONTRA EL PATRIMONIO	43B1B8A26	2026-01-05 13:50:36.18524
18	CARLOS ANIBAL GONZÁLEZ ALEGRE	1202955	Suboficial Ayudante MARICELA  PEREIRA GONZÁLEZ	2026-01-05	09:04	18	HECHO PUNIBLE CONTRA EL PATRIMONIO	7DB63BA26	2026-01-05 13:51:10.810986
19	ADRIANA RAQUEL ESCOBAR ALFONZO	2372146	Suboficial Ayudante DERLIS THOMAS CONCHA PIRIS	2026-01-05	11:31	19	OTRO	3C0A25A26	2026-01-05 15:26:18.989838
20	JUAN MARCELO PINTOS MARTÍNEZ	3197475	Suboficial Ayudante PEDRO LUIS MARTINEZ VEGA	2026-01-05	11:44	20	HECHO PUNIBLE A DETERMINAR	59EED1A26	2026-01-05 16:08:58.323298
21	GUSTAVO ADOLFO BENITEZ AGUILERA 	5076511	Suboficial Ayudante DERLIS THOMAS CONCHA PIRIS	2026-01-05	12:32	21	OTRO	376FB3A26	2026-01-05 16:28:54.230949
22	ROSA IRALA RODRIGUEZ	5751973	Suboficial Ayudante DANNA ARAMI RODRIGUEZ FERNÁNDEZ	2026-01-05	14:32	22	HECHO PUNIBLE CONTRA EL ÁMBITO DE VIDA Y LA INTIMIDAD DE LA PERSONA	1D2865A26	2026-01-05 18:14:37.006387
23	JUAN JOSE GENDE FERNANDEZ	1814168	Suboficial Ayudante DANNA ARAMI RODRIGUEZ FERNÁNDEZ	2026-01-05	15:23	23	OTRO	AAC23CA26	2026-01-05 18:37:31.153165
24	KEVIN ALEJANDRO MENDOZA MORA	5527407	Suboficial Ayudante DANNA ARAMI RODRIGUEZ FERNÁNDEZ	2026-01-05	15:40	24	EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS	D25DD4A26	2026-01-05 18:51:34.847594
25	JUAN BAUTISTA PRIETO ROBLES	2045173	Suboficial Ayudante DANNA ARAMI RODRIGUEZ FERNÁNDEZ	2026-01-05	15:54	25	EXTRAVÍO DE OBJETOS Y/O DOCUMENTOS	94A8CDA26	2026-01-05 19:02:42.75285
26	NORMA BEATRIZ BOGADO VDA. DE RODRIGUEZ	928605	Suboficial Ayudante PEDRO LUIS MARTINEZ VEGA	2026-01-05	14:48	26	HECHO PUNIBLE A DETERMINAR	105846A26	2026-01-05 19:05:01.172463
27	SHIRLEY MARLENE BLASMINIA RAIMUNDO DUARTE 	3426604	Suboficial Ayudante DANNA ARAMI RODRIGUEZ FERNÁNDEZ	2026-01-05	16:24	27	OTRO	FA5A16A26	2026-01-05 19:55:52.142456
28	VICTOR JAVIER GONZALEZ FERNANDEZ	4656756	Suboficial Ayudante DANNA ARAMI RODRIGUEZ FERNÁNDEZ	2026-01-05	17:49	28	OTRO	704CF3A26	2026-01-05 21:14:15.415653
29	DENUNCIANTE PRUEBA	1010101	Oficial Segundo usuario prueba	2026-01-05	22:43	29	Apropiación	F83862A26	2026-01-06 01:44:40.562332
30	DENUNCIANTE2 PRUEBA	998998	Oficial Segundo usuario prueba	2026-01-05	23:02	29	Estafa	753B98A26	2026-01-06 02:03:41.250204
31	DENUNCIA17 PRUEBA	123123	Oficial Segundo usuario prueba	2026-01-05	23:08	17	Daño con fines de estafa de seguro	6890C8A26	2026-01-06 02:09:11.718139
\.


--
-- Data for Name: supuestos_autores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supuestos_autores (id, denuncia_id, autor_conocido, nombre_autor, cedula_autor, domicilio_autor, nacionalidad_autor, estado_civil_autor, edad_autor, fecha_nacimiento_autor, lugar_nacimiento_autor, telefono_autor, profesion_autor, telefonos_involucrados, numero_cuenta_beneficiaria, nombre_cuenta_beneficiaria, entidad_bancaria, creado_en, descripcion_fisica) FROM stdin;
1	18	Desconocido	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 11:51:49.518061	{"detallesAdicionales":"EXTRACCION DE DINERO DE LA CUENTA BANCARIA SIN SU CONCENTIMIENTO "}
2	19	Desconocido	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-03 14:19:53.967279	{"detallesAdicionales":"SUPLANTACION DE NUMERO TELEFONICO "}
3	26	Conocido	JOSE GRACIANO	\N	CIUDAD DE ASUNCIÓN, BARRIO SAN PABLO	PARAGUAYA	\N	\N	\N	\N	0991335549	¨MEDICO CIRUJANO¨	\N	\N	\N	\N	2026-01-05 15:26:18.989838	\N
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, usuario, "contraseña", nombre, apellido, grado, oficina, rol, activo, creado_en, "debe_cambiar_contraseña") FROM stdin;
162	4019988	$2a$10$NEnNNbYyri3D8GP7Y0bHpeTB2p1X2.RbbLv6MqwqD8Vf/6dfH.8jO	VICTOR DIOSNEL	RAMIREZ COLMAN	Suboficial Mayor	Asunción	operador	t	2026-01-01 13:52:10.620588	f
195	6656441	$2a$10$6MCRRa987zo9IgaifMnkdel0tf8ruzD6Et5EP3dNHHNYCxzUm8zHm	ANGEL GABRIEL	CARVALLO FLORENTIN	Suboficial Ayudante	Asunción	operador	t	2026-01-02 10:22:33.356022	f
178	6197444	$2a$10$qNqxsI7kpFp0vI1mZXiT0ewhUDX5GIGMpLbr2ZH9hoDPiZeogKhwG	ARNALDO ANDRÉS	AVALOS RUIZ DÍAZ	Suboficial Segundo	Asunción	operador	f	2026-01-01 15:12:07.609496	t
185	6625656	$2a$10$UQSaVA84r2ZlkwLDdbao3OEHjLoxfjcWXto.bz6U1J.xgTqYr9gMi	TIAGO JOSE	FRANCO AMARILLAS	Suboficial Ayudante	Asunción	operador	t	2026-01-01 20:20:40.420704	f
168	5887462	$2a$10$gQrXaX4MMGRJLxZDXVL92OOQmLDWpS1baXNxF1pkXL/7nqTx6TAM.	MARICELA 	PEREIRA GONZÁLEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:10:33.839018	f
176	6936357	$2a$10$ehk9fbaV/6tZAnaXYKMH4u.T0GSrb0T5O3Ba9hR7a/lWogt//KXUi	ALEXIS MIGUEL	AGÜERO GIMÉNEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:33:36.230361	f
165	5080419	$2a$10$dMp4m0XZGXleJCu86JqlyuGwl9/ZGy0kzzysOSbeHF4/gSYF8dbZe	CAROLINA NOEMI	SARABIA GONZALEZ	Suboficial Segundo	Asunción	operador	t	2026-01-01 13:59:47.762009	f
8	57213	$2a$10$1bodo7v7tXtvm5ug6gzqU.1puLXgTT5qnwSMJU6aJWs/7EZpaIRBe	DAVID RICARDO	ROLDÁN ECHEVERRÍA	Oficial Inspector	Asunción	superadmin	t	2025-12-22 13:22:29.38378	f
182	6725276	$2a$10$dll32XjeGvZe6.jBycFUyORZYUoAkJdU6ycV8l.lShdmSO4ZAsfG2	GERMAN EMANUEL	RUIZ DÍAZ	Suboficial Ayudante	Asunción	operador	t	2026-01-01 17:40:05.403455	f
197	4537502	$2a$10$CbEG0B1mSavjCeINGJG7uOuXbQNtFUzVm/56oBvYJ/BPz3nAqO/ES	ANGEL ALFREDO	CABALLERO GONZALEZ	Suboficial Inspector	Asunción	operador	t	2026-01-02 11:08:17.845084	t
187	5675555	$2a$10$uT5YdJWtMDZgWW4JClI2Te/7TbV.X/TyWjTDJtkuKRq7YGwmUyhga	LUNA	MARECOSESPINOLA	Suboficial Ayudante	Asunción	operador	t	2026-01-02 09:34:40.866769	f
189	5022063	$2a$10$kx2RsCQxNK/3jgBllqKGd.za0dyQO6NEHfP2ntWNOAxbzF0CjE2o6	MATIAS RAMÓN	ORTIGOZA GÓMEZ	Oficial Ayudante	Asunción	operador	t	2026-01-02 09:48:50.950174	f
166	5028758	$2a$10$MHusnq00976q7HmxqgpGPu2oGHS4IYcB7C62lOFIRnCJZP8XnM/f.	MARÍA SOLEDAD	MIRANDA AMARILLA	Oficial Ayudante	Asunción	operador	t	2026-01-01 14:04:19.540258	f
201	4362212	$2a$10$AqlAyRIymOkX.RgEClT1BugW.lIcKHXqWKQw5/1CfsqN38XgyeU.y	JUAN JOSE	VILLALBA MELGAREJO	Oficial Inspector	Asunción	operador	f	2026-01-05 10:49:33.114896	t
184	6798971	$2a$10$S.gAcJCQi6FtPGJbgJyBg.BV6bznwmAaIXMU3mPPvNPBp5umr1tI.	AXEL FERNANDO	DUARTE ORTIGOZA	Suboficial Ayudante	Asunción	operador	t	2026-01-01 20:20:01.660051	f
191	4966336	$2a$10$oG5CEO8Jitpc7/jRHm3QneAWA/pfcDHuA1pHWiHJSQYUoVTM7fbN6	HUMBERTO GUILLERMO	NÚÑEZ BENÍTEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-02 10:08:44.621267	f
180	5624996	$2a$10$N6jhwXbUOtwzhfFSpbkIt.9e2o/QEa8p6oPSgm7HxdJJC7VuHrqYy	EMMANUEL	FERNÁNDEZ VEGA	Oficial Segundo	Asunción	operador	t	2026-01-01 17:33:18.26773	t
193	5081547	$2a$10$QwP0RtPpmg.Eo7//x8L37.tiRy2YyLrvGD5FwPmpSSVUonCm3XnMu	DAISY NOEMI	AGUILAR CABAÑAS	Suboficial Ayudante	Asunción	operador	t	2026-01-02 10:15:45.031486	f
203	5237885	$2a$10$SKGBfaej53L2Fw0T6V97z.Bl86tCxpoRzEpgzyOzy9kahkhF2TOzW	PEDRO LUIS	MARTINEZ VEGA	Suboficial Ayudante	Asunción	operador	t	2026-01-05 12:56:23.635554	f
205	3391713	$2a$10$nqFJrtpehAonbr3TO4IAdObc8Jw3pQPWo53GRtaht5YryEYk6qCOu	LEANDRO ANTONIO	RUSSO JIMENEZ	Oficial Primero	Asunción	operador	t	2026-01-05 13:17:25.593569	f
167	6150919	$2a$10$peC1NSWLlRk5RMnVN.7/7uGePmmbpiEOQPuBZIFEFpRG2Uu9P9t4C	FATIMA	BERNAL FARIÑA	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:08:47.284911	f
217	3431166	$2a$10$rJcklCekq14ILBbF6Zg1w.KO/FVmWlvgvoTAYkYXdCMFS4oLHRQIK	MARIANO	ESPINOLA SACHELARIDI	Suboficial Inspector	Asunción	operador	t	2026-01-05 15:05:35.931539	t
207	4715901	$2a$10$0viY7Wm/w30CQVrYB1V19.Gzg6f8pKPZvhE3//M0.J1hVp3nbzY8m	LUCAS DARIO	ROMERO CHAVEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:28:37.035013	f
209	4544640	$2a$10$iIp34lA8HqC866gsAY7f6OrZZw5uAxrSmPF6UEfFLVtlRUj96oOyG	DAVID DANIEL 	BAEZ LARREA	Oficial Primero	Asunción	operador	t	2026-01-05 13:39:15.363662	f
5	garv	$2a$10$Etd/ZwbSV08PNLjRiuKlxOwKUqV71voqeShy3uDLJngj/kYVHlMnW	GUILLERMO ANDRES	RECALDE VALDEZ	Oficial Segundo	Asunción	superadmin	t	2025-12-15 22:56:40.713373	f
211	6722700	$2a$10$jO5NIBZwAdN2nVVJ0oKxNeq25Q4I4tjtXdriBnnidC9iVeKwwLlcm	DERLIS DARIO	SOSA FUNEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:48:47.022177	f
213	6111073	$2a$10$2K2bncgSP7F7qA1y90pQj.PXLyfln2q6Uwnkq0UcfcBm02Y6qepva	GUSTAVO ESEQUIEL	BAREIRO FERREIRA	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:58:51.211029	f
215	4717546	$2a$10$gEz8Hh90NDWdCBDjeCh1q./znU7xl5whD2nrx0mWmFV0e0tShsQy.	JAIDY YAMILA	FERNANDEZ GAMARRA	Suboficial Ayudante	Asunción	operador	t	2026-01-05 14:08:31.732826	f
199	4526162	$2a$10$AuXMIyFz.ADSWIw4XBGA/uSomrEPXKMh7BUT3wDib2nm07hmU7M1a	VICENTE EUGENIO	DUARTE LEÓN	Suboficial Mayor	Asunción	operador	f	2026-01-04 15:35:45.043098	f
219	4911027	$2a$10$873qxrRpuASc4bVKtbn39uxnYiKZxwfLLt.Fa/KYTuSWGkjX.auLW	EDGAR VICENTE	CABALLERO ESPÍNOLA	Oficial Inspector	Asunción	operador	t	2026-01-05 15:41:18.498046	t
154	5504852	$2a$10$thcXqWc97lxaUx20K4S4z.q62ic3KFocMKCttx4SJ6qxumdECRzfe	DILMA MARIA	ALVARENGA OJEDA	Suboficial Ayudante	Asunción	operador	t	2026-01-01 13:27:06.14372	f
159	3967326	$2a$10$qVXAWsMDC4sMf4dfiDwf3.KuVK1uiWyNvzUm9Hxo0Bt2YrJX8aT52	NICOLAS	ESCOBAR GARCÍA	Oficial Segundo	Asunción	operador	t	2026-01-01 13:45:58.467959	f
158	5149591	$2a$10$MTejmI5kS4CBXnYg7i7abOOKDHW269fS1Aj5ld2tyYNVuQHx8qzyO	FRANCISCO NICOLAS	GALEANO BRITEZ	Oficial Ayudante	Asunción	operador	t	2026-01-01 13:41:14.541357	f
160	5378636	$2a$10$mBZGHhJP9zBrIigf9KnBUOGNwSm1adDGKFtJCO0ygA52gcgR56FEq	EDGAR ANDRES	GRANCE AVALOS	Oficial Inspector	Asunción	operador	t	2026-01-01 13:50:24.728962	f
163	5137216	$2a$10$fmKRAlh20cjlZQPhomRWSOHG22ZTRXgT7hNAWjEL0A22QEBg.oLRK	JULIO CESAR	ROMERO ROMERO	Suboficial Inspector	Asunción	operador	t	2026-01-01 13:54:16.392742	f
164	5073159	$2a$10$vTMMtRNYsQ8BzsAE7ycNDuwV45JymZ8iLqn8x3eTWAuKXnjyHlnvy	JUAN ANGEL	RIVEROS GONZALEZ	Suboficial Inspector	Asunción	operador	t	2026-01-01 13:56:25.165852	f
161	4866234	$2a$10$bdFq0pGUl0fVDAzAzZwoV.wh8NWfL.jh8ZkC8nX.XTb6wOPxqDm1m	PABLO CÉSAR	CANTERO GONZÁLEZ	Oficial Primero	Asunción	operador	t	2026-01-01 13:51:20.382582	f
170	4930361	$2a$10$00xaLeEZeSc3hylgntdQiOk.M69O8mQa.LhziiA4BTgfUrZMbgfse	LUIS MARÍA 	CANO PEREIRA	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:14:00.066325	f
172	6953487	$2a$10$C11HfEeTysXJwDeQ2opMsOsKSpSihVLz2NQlWLQ62EtTRFuTrgMga	JACQUELINE MONTSERRAT	ESTIGARRIBIA ORTIZ	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:19:14.392595	f
169	6827433	$2a$10$IsoeKBgBl5ni0wySzKtxLOIQaWMtcV6MeQZlCdhNr7Od6hfoq7JL.	WALTER DAVID	FRANCO CABRERA	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:12:04.674343	f
173	4984316	$2a$10$BAmNvSZhEC6Lp7IcULQqTeLpDNZ65O2U4kvYNJxWOCvIxMXkgrvAm	JORGE JEREMIAS	LOPEZ LOPEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:21:30.14288	f
174	5461243	$2a$10$bOBywOQFJAhlwlOiFrYdKuaz9lsp2eZ0HvftWTI1WPZrOvv50Z8EG	JEREMÍAS JOSÉ	ARMOA ESCOBAR	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:28:34.808216	f
175	8090607	$2a$10$oGKuXZd9dOOE/9KPFHPzJOP4BCv4AldG0DwbxrQwd5T0oBbRiVkEO	MARCIANO ROLANDO	BOGADO MARTINEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-01 14:30:26.716301	f
202	6826337	$2a$10$Fr42l0Pq2rTJjQCTlUjcJ.VdiRF2UQeuxbtZONzxqeIifEW8c8R.m	DERLIS THOMAS	CONCHA PIRIS	Suboficial Ayudante	Asunción	operador	t	2026-01-05 12:51:06.062337	f
179	3661602	$2a$10$y3c46uRE7dKgnSNZ/jXLyuiRrEOw.bp6yGDL0IDDZ89UrivdP74Oi	JUAN ANDRES	RAMÍREZ SERVIN	Oficial Primero	Asunción	operador	f	2026-01-01 15:20:47.81982	t
204	5489441	$2a$10$r7rkcdcmCwlwjrEvIlCLu.QDIqtrlY1w06r2Cn9xW6r1bUOS/vxQK	DANNA ARAMI	RODRIGUEZ FERNÁNDEZ	Suboficial Ayudante	Asunción	operador	t	2026-01-05 12:58:47.675043	f
206	5171179	$2a$10$ir308PEKwBLWO6f4onBm8.VZ9fSPaUISvOWC72QrMaUvufsQeOhxi	ARACELI LUJAN	FRANCO DELGADILLO	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:23:44.014197	f
190	6788039	$2a$10$P4e2NoNp57R6qDxnEkaJSeIQzcVxbX4yyOEqaJsWmNFpqGYYllvDK	MATIAS SEBASTIAN	SOSA ALVAREZ	Suboficial Ayudante	Asunción	operador	t	2026-01-02 10:04:36.07015	f
192	5224102	$2a$10$HmzUNGF5dhgMAYVv82wzXeHIj2Dh63AXFrS6y1rfxmbFmFCiCNjUe	ISUSI ARAMI	GALEANO ALVARENGA	Suboficial Ayudante	Asunción	operador	t	2026-01-02 10:13:46.132491	f
177	3394727	$2a$10$yLQI33ybD.Vn.9bO.QSh4usp9BKDCq61hL/1tTwTprnKTUW/3Ppwy	LIZ MARLENE	PICO ISASA	Oficial Inspector	Asunción	operador	t	2026-01-01 15:07:39.187578	f
194	5723436	$2a$10$kMxLZjZaUYdMFReKHdBvw.HHwky85uK7VMWjB8K8pdRX376CSofuu	CRISTHIAN LUCIANO	AGUILAR RAMIREZ	Suboficial Ayudante	Asunción	operador	t	2026-01-02 10:19:04.891261	f
196	4233547	$2a$10$AzuLFhI6QSqyl9EI7mpi/eoM6zjrRT30LZev.xYKOyAb6V/wN/hra	STIVEN RODOLFO	FERNANDEZ BENÍTEZ	Suboficial Inspector	Asunción	operador	t	2026-01-02 10:32:59.182055	f
208	7822617	$2a$10$zZfU9Px5n8qkpHvWRp1Pm.YxswPuGb0sXLXy6oQNou3T98YQFGZ6K	ULISES GABRIEL	TORRES ROA	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:37:17.627715	f
188	5964755	$2a$10$DC1vZGFXEKPuMggGSAJrZOJNB6GNtRDwDlo2Nax7vxoUIRK28s0tW	ROMINA GISELL	SÁNCHEZ SANABRIA	Suboficial Segundo	Asunción	operador	t	2026-01-02 09:44:01.286949	f
183	5450960	$2a$10$asC0QbzeJVyRlgFvxdYhs.bOV8IhBH2/9PmCQhBqCS6adi1t5l1c2	EMILIANO	FLORENTIN BAREIRO	Oficial Primero	Asunción	operador	t	2026-01-01 20:19:10.721091	f
210	5771954	$2a$10$V/Iet9CzeT3z/QY8w1xFv.P3DrIrrlwicyVMGNC39PXklAbqBNDyK	FABRIZZIO MIGUEL ANGEL	ORREGO ARCE	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:44:46.739365	f
212	5110402	$2a$10$BljyXWqrZ/2uSCKewd2bte4UIZFHioLqrL24.ZC7xGxG3Kt/eGVJO	ENZO LEONARDO	MORINIGO GAMARRA	Suboficial Ayudante	Asunción	operador	t	2026-01-05 13:55:02.047463	f
214	5420157	$2a$10$nbDevumh9CqdwqVD9jeasurX/kx2YWtD9S7mmQQDzCRVfRBWGh8uO	IVAN JAVIER	BENITEZ CARRILLO	Suboficial Ayudante	Asunción	operador	t	2026-01-05 14:02:46.926857	f
200	4820375	$2a$10$.6kEvVetZHsAaQZBh8fICezHfgirJRd3MgYLgoHGaOjyiZCO2G8PG	OLGA MARIBEL	SERVIN RIVAS	Oficial Inspector	Asunción	operador	t	2026-01-04 15:42:27.399411	f
216	5195730	$2a$10$QUQyoJ9uvvwv9Z9LWfo5QOrkEThI4mcVTzQJ4LaAgSr1RV0.v1lvK	BRUNO AMALIO	GIMÉNEZ GONZÁLEZ	Oficial Segundo	Asunción	operador	t	2026-01-05 14:50:10.455447	t
198	5641081	$2a$10$ePTwRVCLEd7KG4KVC4gKp.bdEYi.NcGKo/D4v.w8nY1CWF6.fHX3e	YONNY ARIEL	YAHARI AYALA	Suboficial Segundo	Asunción	operador	f	2026-01-04 15:24:28.74652	f
181	7628692	$2a$10$TZn25VdNXhsYic.TRf9ROegNhx2HPn3wH6D4nJyPoH5YvlrtUC9cG	JOSÉ GERÓNIMO	BENÍTEZ BENÍTEZ	Suboficial Segundo	Asunción	operador	t	2026-01-01 17:38:28.762128	t
218	4419913	$2a$10$Kt0cCtjy7zW0jVajNf0Z9ewXpVViWq/LrQaQT9/OfbO57beldFlVm	JUAN JOSÉ	BLANCO SANABRIA	Suboficial Segundo	Asunción	operador	t	2026-01-05 15:17:15.52241	t
186	4689036	$2a$10$7tQ90cFyHB/ViOw/9Z3Ns.OASd3D7zFVknlnv2Oz55MFBLHvTufhS	PABLO MARCELO	ESPINOZA ROMERO	Oficial Ayudante	Asunción	operador	t	2026-01-02 09:30:56.819816	f
220	user1	$2a$10$bBkTenI1DMlBNR.i6fIWH.tJaTvRmBZXwqjNYxjLItCBZd7rhX54i	usuario	prueba	Oficial Segundo	Asunción	operador	t	2026-01-06 01:37:38.282582	f
\.


--
-- Data for Name: visitas_denuncias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visitas_denuncias (id, denuncia_id, usuario_id, fecha_visita) FROM stdin;
1	1	5	2026-01-02 14:01:32.461682
2	1	5	2026-01-02 14:01:32.718919
3	1	5	2026-01-02 14:05:49.491137
4	1	5	2026-01-02 14:05:50.047315
5	2	5	2026-01-02 15:17:17.372389
6	2	5	2026-01-02 15:17:17.397969
7	3	5	2026-01-02 15:19:45.936923
8	3	5	2026-01-02 15:19:46.436178
9	3	5	2026-01-02 15:43:18.651604
10	3	5	2026-01-02 15:43:18.657859
11	3	5	2026-01-02 15:57:04.150826
12	3	5	2026-01-02 15:57:04.173583
13	1	5	2026-01-02 15:57:50.722543
14	1	5	2026-01-02 15:57:50.817155
15	3	5	2026-01-02 16:02:48.487645
16	3	5	2026-01-02 16:02:48.590383
17	4	5	2026-01-02 17:52:17.559977
18	4	5	2026-01-02 17:52:17.733921
19	6	5	2026-01-02 17:53:55.328962
20	6	5	2026-01-02 17:53:55.666616
21	4	5	2026-01-02 17:54:55.997868
22	4	5	2026-01-02 17:54:56.165238
23	6	5	2026-01-02 17:55:05.139398
24	6	5	2026-01-02 17:55:05.471148
25	6	5	2026-01-02 18:12:10.202192
26	6	5	2026-01-02 18:12:10.239907
27	6	5	2026-01-02 18:17:12.192372
28	6	5	2026-01-02 18:17:12.202894
29	7	5	2026-01-02 19:55:53.844493
30	7	5	2026-01-02 19:55:53.885141
31	9	5	2026-01-02 19:59:37.188706
32	9	5	2026-01-02 19:59:37.278137
33	9	5	2026-01-02 20:04:30.287953
34	9	5	2026-01-02 20:04:30.3761
35	9	5	2026-01-02 20:15:40.550641
36	13	5	2026-01-02 22:04:40.249393
37	13	5	2026-01-02 22:04:40.274307
38	13	5	2026-01-02 22:05:03.866939
39	13	5	2026-01-02 22:05:04.299863
40	16	5	2026-01-02 22:05:09.468881
41	16	5	2026-01-02 22:05:09.640082
42	11	5	2026-01-02 22:05:18.966085
43	11	5	2026-01-02 22:05:19.116304
44	11	5	2026-01-02 22:06:08.979349
45	11	5	2026-01-02 22:06:09.220688
46	7	184	2026-01-03 09:11:02.765933
47	7	184	2026-01-03 09:11:03.722811
48	17	5	2026-01-03 12:19:03.089483
49	17	5	2026-01-03 12:19:03.252815
50	18	5	2026-01-03 12:19:32.012155
51	18	5	2026-01-03 12:19:32.182886
52	1	165	2026-01-04 11:37:51.003231
53	1	165	2026-01-04 11:37:51.034814
54	19	8	2026-01-04 15:17:39.589475
55	19	8	2026-01-04 15:17:40.509543
56	19	8	2026-01-05 12:22:58.026069
57	19	8	2026-01-05 12:22:58.370727
58	22	5	2026-01-05 13:19:44.745905
59	22	5	2026-01-05 13:19:44.982084
60	22	5	2026-01-05 13:22:51.782483
61	22	5	2026-01-05 13:22:52.028548
64	23	168	2026-01-05 13:52:07.062824
65	23	168	2026-01-05 13:52:07.358754
66	23	5	2026-01-06 00:13:00.008694
67	23	5	2026-01-06 00:13:00.053309
78	23	5	2026-01-06 00:47:50.102507
79	23	5	2026-01-06 00:47:50.334074
\.


--
-- Name: ampliaciones_denuncia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ampliaciones_denuncia_id_seq', 1, false);


--
-- Name: codigos_activacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.codigos_activacion_id_seq', 14, true);


--
-- Name: denunciantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.denunciantes_id_seq', 32, true);


--
-- Name: denuncias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.denuncias_id_seq', 39, true);


--
-- Name: denuncias_involucrados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.denuncias_involucrados_id_seq', 41, true);


--
-- Name: dispositivos_autorizados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dispositivos_autorizados_id_seq', 6, true);


--
-- Name: historial_denuncias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historial_denuncias_id_seq', 31, true);


--
-- Name: supuestos_autores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supuestos_autores_id_seq', 3, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 220, true);


--
-- Name: visitas_denuncias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visitas_denuncias_id_seq', 81, true);


--
-- Name: ampliaciones_denuncia ampliaciones_denuncia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ampliaciones_denuncia
    ADD CONSTRAINT ampliaciones_denuncia_pkey PRIMARY KEY (id);


--
-- Name: codigos_activacion codigos_activacion_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_activacion
    ADD CONSTRAINT codigos_activacion_codigo_key UNIQUE (codigo);


--
-- Name: codigos_activacion codigos_activacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_activacion
    ADD CONSTRAINT codigos_activacion_pkey PRIMARY KEY (id);


--
-- Name: configuracion_sistema configuracion_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_sistema
    ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (clave);


--
-- Name: denunciantes denunciantes_cedula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denunciantes
    ADD CONSTRAINT denunciantes_cedula_key UNIQUE (cedula);


--
-- Name: denunciantes denunciantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denunciantes
    ADD CONSTRAINT denunciantes_pkey PRIMARY KEY (id);


--
-- Name: denuncias denuncias_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_hash_key UNIQUE (hash);


--
-- Name: denuncias_involucrados denuncias_involucrados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias_involucrados
    ADD CONSTRAINT denuncias_involucrados_pkey PRIMARY KEY (id);


--
-- Name: denuncias denuncias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_pkey PRIMARY KEY (id);


--
-- Name: dispositivos_autorizados dispositivos_autorizados_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos_autorizados
    ADD CONSTRAINT dispositivos_autorizados_fingerprint_key UNIQUE (fingerprint);


--
-- Name: dispositivos_autorizados dispositivos_autorizados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos_autorizados
    ADD CONSTRAINT dispositivos_autorizados_pkey PRIMARY KEY (id);


--
-- Name: historial_denuncias historial_denuncias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_denuncias
    ADD CONSTRAINT historial_denuncias_pkey PRIMARY KEY (id);


--
-- Name: supuestos_autores supuestos_autores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supuestos_autores
    ADD CONSTRAINT supuestos_autores_pkey PRIMARY KEY (id);


--
-- Name: ampliaciones_denuncia unique_denuncia_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ampliaciones_denuncia
    ADD CONSTRAINT unique_denuncia_numero UNIQUE (denuncia_id, numero_ampliacion);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- Name: visitas_denuncias visitas_denuncias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas_denuncias
    ADD CONSTRAINT visitas_denuncias_pkey PRIMARY KEY (id);


--
-- Name: idx_ampliaciones_denuncia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ampliaciones_denuncia ON public.ampliaciones_denuncia USING btree (denuncia_id);


--
-- Name: idx_ampliaciones_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ampliaciones_fecha ON public.ampliaciones_denuncia USING btree (fecha_ampliacion);


--
-- Name: idx_codigos_activacion_activo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_activacion_activo ON public.codigos_activacion USING btree (activo);


--
-- Name: idx_codigos_activacion_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_activacion_codigo ON public.codigos_activacion USING btree (codigo);


--
-- Name: idx_codigos_activacion_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_activacion_nombre ON public.codigos_activacion USING btree (nombre);


--
-- Name: idx_codigos_activacion_usado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_activacion_usado ON public.codigos_activacion USING btree (usado);


--
-- Name: idx_denunciantes_cedula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denunciantes_cedula ON public.denunciantes USING btree (cedula);


--
-- Name: idx_denunciantes_matricula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denunciantes_matricula ON public.denunciantes USING btree (matricula);


--
-- Name: idx_denuncias_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_fecha ON public.denuncias USING btree (fecha_denuncia);


--
-- Name: idx_denuncias_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_hash ON public.denuncias USING btree (hash);


--
-- Name: idx_denuncias_involucrados_denuncia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_involucrados_denuncia ON public.denuncias_involucrados USING btree (denuncia_id);


--
-- Name: idx_denuncias_involucrados_denunciante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_involucrados_denunciante ON public.denuncias_involucrados USING btree (denunciante_id);


--
-- Name: idx_denuncias_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_orden ON public.denuncias USING btree (orden);


--
-- Name: idx_dispositivos_activo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_activo ON public.dispositivos_autorizados USING btree (activo);


--
-- Name: idx_dispositivos_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_fingerprint ON public.dispositivos_autorizados USING btree (fingerprint);


--
-- Name: idx_dispositivos_ultimo_acceso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_ultimo_acceso ON public.dispositivos_autorizados USING btree (ultimo_acceso);


--
-- Name: idx_supuestos_autores_denuncia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supuestos_autores_denuncia ON public.supuestos_autores USING btree (denuncia_id);


--
-- Name: idx_visitas_denuncia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitas_denuncia ON public.visitas_denuncias USING btree (denuncia_id);


--
-- Name: idx_visitas_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitas_usuario ON public.visitas_denuncias USING btree (usuario_id);


--
-- Name: ampliaciones_denuncia ampliaciones_denuncia_denuncia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ampliaciones_denuncia
    ADD CONSTRAINT ampliaciones_denuncia_denuncia_id_fkey FOREIGN KEY (denuncia_id) REFERENCES public.denuncias(id) ON DELETE CASCADE;


--
-- Name: ampliaciones_denuncia ampliaciones_denuncia_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ampliaciones_denuncia
    ADD CONSTRAINT ampliaciones_denuncia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: codigos_activacion codigos_activacion_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_activacion
    ADD CONSTRAINT codigos_activacion_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: denuncias denuncias_denunciante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_denunciante_id_fkey FOREIGN KEY (denunciante_id) REFERENCES public.denunciantes(id) ON DELETE CASCADE;


--
-- Name: denuncias_involucrados denuncias_involucrados_denuncia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias_involucrados
    ADD CONSTRAINT denuncias_involucrados_denuncia_id_fkey FOREIGN KEY (denuncia_id) REFERENCES public.denuncias(id) ON DELETE CASCADE;


--
-- Name: denuncias_involucrados denuncias_involucrados_denunciante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias_involucrados
    ADD CONSTRAINT denuncias_involucrados_denunciante_id_fkey FOREIGN KEY (denunciante_id) REFERENCES public.denunciantes(id) ON DELETE CASCADE;


--
-- Name: denuncias_involucrados denuncias_involucrados_representa_denunciante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias_involucrados
    ADD CONSTRAINT denuncias_involucrados_representa_denunciante_id_fkey FOREIGN KEY (representa_denunciante_id) REFERENCES public.denunciantes(id) ON DELETE SET NULL;


--
-- Name: denuncias denuncias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: dispositivos_autorizados dispositivos_autorizados_codigo_activacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos_autorizados
    ADD CONSTRAINT dispositivos_autorizados_codigo_activacion_id_fkey FOREIGN KEY (codigo_activacion_id) REFERENCES public.codigos_activacion(id) ON DELETE SET NULL;


--
-- Name: supuestos_autores supuestos_autores_denuncia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supuestos_autores
    ADD CONSTRAINT supuestos_autores_denuncia_id_fkey FOREIGN KEY (denuncia_id) REFERENCES public.denuncias(id) ON DELETE CASCADE;


--
-- Name: visitas_denuncias visitas_denuncias_denuncia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas_denuncias
    ADD CONSTRAINT visitas_denuncias_denuncia_id_fkey FOREIGN KEY (denuncia_id) REFERENCES public.denuncias(id) ON DELETE CASCADE;


--
-- Name: visitas_denuncias visitas_denuncias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitas_denuncias
    ADD CONSTRAINT visitas_denuncias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

