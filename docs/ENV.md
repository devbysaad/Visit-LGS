# Environment setup — CampusQuest (Clerk + Supabase)

## What you need to create

1. **Clerk** app at [dashboard.clerk.com](https://dashboard.clerk.com)  
   - Enable the sign-in methods you want (Google, email magic link, etc.) — no custom password UI in our app.
2. **Supabase** project at [supabase.com](https://supabase.com)  
   - Run SQL from [`supabase/schema.sql`](../supabase/schema.sql) in the SQL editor.

## Files to create

| File | Purpose |
| --- | --- |
| `.env` (repo root) | Server secrets |
| `client/.env` | Vite public keys |

Copy from `.env.example` and `client/.env.example`.

## Variables

### Root `.env` (server)

| Variable | Required | Where to find |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | Yes (for real login) | Clerk → API Keys → Secret key (`sk_…`) |
| `SUPABASE_URL` | Yes (for DB profiles) | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for DB profiles) | Supabase → Settings → API → `service_role` (keep secret) |
| `PORT` | No (default `2567`) | — |
| `CORS_ORIGIN` | Prod recommended | Your Vercel URL |
| `DATABASE_URL` | Optional | Supabase → Database → Connection string |

### `client/.env`

| Variable | Required | Where to find |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk → API Keys → Publishable (`pk_…`) |
| `VITE_SUPABASE_URL` | Optional client reads | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Optional client reads | Supabase → `anon` `public` key |
| `VITE_SERVER_URL` | Prod only | Railway / host WebSocket URL `wss://…` |

## Auth flow

1. Player signs in via **Clerk** (hosted UI).
2. Client calls `POST /auth/sync` with the Clerk session JWT.
3. Server verifies the JWT with `CLERK_SECRET_KEY`, loads the Clerk user, upserts `profiles` in Supabase.
4. Avatar select → campus.

Without college student IDs: any Clerk user can play. Later you can restrict by email domain (`@lgs.edu.pk`) or a staff allow-list table in Supabase.

## After adding keys

```bash
# restart server so dotenv reloads
yarn start
# client
yarn client
```

Hard-refresh the browser.
