# API Routes (BFF)

This folder contains Next.js BFF routes used by web clients and SSR.

## Responsibility Boundary

- `src/services/*`: client-facing helpers for React components.  
  They call local BFF endpoints such as `/api/admin/links`.
- `src/app/api/*`: BFF layer for forwarding/auth/error shaping.  
  They communicate with Go backend endpoints.
- Homepage/public BFF routes are read-only by default.
- Admin-side writes are unified under `/api/admin/*`.

## Common Response Shape

- Success: backend payload passthrough (for example `{ data }`, `{ links }`, `{ works }`).
- Error: JSON with `error` message and HTTP status.

## Admin Endpoints (examples)

- `POST /api/admin/login` -> `{ ok?: boolean, user?: object }`
- `GET /api/admin/me` -> `{ user: { id, username, role } }`
- `GET /api/admin/links` -> `{ links: array }`
- `POST /api/admin/links` -> `{ data?: object, link?: object }`
- `PATCH /api/admin/works/:id` -> `{ work?: object }`
- `PUT /api/admin/content/:id` -> `{ data?: object }`

## Validation

High-risk write routes use Zod validation:

- `/api/admin/content`
- `/api/admin/links`
- `/api/admin/users`

## Caching

Public GET routes may define `export const revalidate = 60`.
Admin routes and write operations default to no cache.
