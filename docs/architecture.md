# Arquitectura base del sistema

Esta arquitectura separa dominio, servicios, UI y DB para mantener
claridad, seguridad y escalabilidad en un sistema de restaurantes.

## Carpetas principales

- `src/app`: rutas del App Router (UI, API Routes, streaming).
- `src/actions`: Server Actions (mutaciones seguras del servidor).
- `src/components`: componentes UI reutilizables (presentacionales).
- `src/ui`: UI por vistas/flows (cliente, cocina, admin).
- `src/domains`: lógica de negocio por contexto (use-cases, policies, repos).
- `src/services`: integraciones externas (Cloudinary, realtime, email/SMS).
- `src/db`: acceso a datos (Prisma client, helpers, transacciones).
- `src/schemas`: validaciones Zod (inputs y contratos).
- `src/lib`: utilidades transversales (auth, errores, seguridad, env).
- `src/types`: tipos compartidos.
- `src/utils`: helpers generales y puros.

## Estructura sugerida por dominio

```
src/domains
  orders
    entities
    policies
    repository
    use-cases
    events
  menu
    entities
    repository
    use-cases
  billing
    entities
    repository
    use-cases
  users
    entities
    policies
    repository
    use-cases
```

## Rutas App Router

- `src/app/(public)`: cliente (menú, pedido, tracking).
- `src/app/(staff)`: cocina y admin (panel, comanda, reportes).
- `src/app/api`: webhooks, uploads, realtime, auth callbacks.

## Principios

- Server Actions para mutaciones (con Zod + auth + permisos).
- DB aislada en `src/db` para evitar queries en UI.
- Errores normalizados en `src/lib/errors`.
- Seguridad centralizada en `src/lib/auth` y `src/lib/security`.

## Convenciones recomendadas

- Cada dominio vive en `src/domains/<dominio>` con:
  - `entities` (modelos de negocio),
  - `policies` (reglas),
  - `repository` (queries),
  - `use-cases` (casos de uso),
  - `events` (eventos del dominio).
- Las rutas públicas (cliente) y privadas (cocina/admin) se separan en
  `src/app/(public)` y `src/app/(staff)`.
- Las Server Actions usan Zod desde `src/schemas` y devuelven errores
  normalizados desde `src/lib/errors`.
