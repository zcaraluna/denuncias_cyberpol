SET client_encoding = 'UTF8';
ALTER TABLE public.usuarios RENAME COLUMN "contrase??a" TO "contraseña";
ALTER TABLE public.usuarios RENAME COLUMN "debe_cambiar_contrase??a" TO "debe_cambiar_contraseña";
