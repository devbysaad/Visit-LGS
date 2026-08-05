# Environment setup — CampusQuest (Clerk + Prisma / Supabase Postgres)

## What you need to create

1. **Clerk** app at [dashboard.clerk.com](https://dashboard.clerk.com)  
   - Enable the sign-in methods you want (Google, email magic link, etc.) — no custom password UI in our app.
2. **Supabase** Postgres at [supabase.com](https://supabase.com)  
   - Copy the pooler connection strings (Database settings).  
   - Prisma owns the `profiles` table (`prisma/schema.prisma`).

## Files to create

| File | Purpose |
| --- | --- |
| `.env` (repo root) | Server secrets + Prisma URLs |
| `client/.env` | Vite public keys |

Copy from `.env.example` and `client/.env.example`.

## Variables

### Root `.env` (server)

| Variable | Required | Where to find |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | Yes | Clerk → API Keys → Secret key (`sk_…`) |
| `DATABASE_URL` | Yes (profiles) | Supabase → Database → Transaction pooler URI (`:6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | Yes (migrations) | Supabase → Database → Session pooler URI (`:5432`) |
| `PORT` | No (default `2567`) | — |
| `CORS_ORIGIN` | Prod recommended | Your Vercel URL |

Replace `[YOUR-PASSWORD]` with the database password from Supabase → Project Settings → Database.

### `client/.env`

| Variable | Required | Where to find |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk → API Keys → Publishable (`pk_…`) |
| `VITE_SERVER_URL` | Prod only | Railway / host WebSocket URL `wss://…` |

## Prisma

```bash
# generate client after schema changes
yarn prisma:generate

# push schema to Supabase (dev) — uses DIRECT_URL
yarn prisma:push

# or create a named migration
yarn prisma:migrate
```

Schema: `prisma/schema.prisma`  
Runtime client: `server/prisma.ts` (reads `DATABASE_URL`)

## Auth flow

1. Player signs in via **Clerk** (hosted UI).
2. Client calls `POST /auth/sync` with the Clerk session JWT.
3. Server verifies the JWT with `CLERK_SECRET_KEY`, loads the Clerk user, upserts `profiles` with Prisma.
4. Avatar select → campus.

Without college student IDs: any Clerk user can play. Later you can restrict by email domain (`@lgs.edu.pk`) or a staff allow-list.

## After adding keys

```bash
yarn prisma:generate
yarn prisma:push
yarn start   # server — dotenv reloads .env
yarn client  # Vite — restart after changing client/.env
```

Hard-refresh the browser.
