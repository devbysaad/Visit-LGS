# Deployment — CampusQuest

## Hosting decision

| Piece | Host | Why |
| --- | --- | --- |
| Client (static Vite build) | **Vercel** | Static CDN fit |
| Colyseus server | **Railway** (Singapore region) | Persistent Node + WebSockets; nearer to Wah/Lahore than US |

**Trap:** The WebSocket server **cannot** run on Vercel or Netlify serverless. Client and server are separate deploys.

## Environment variables

### Client (`client/`)

| Var | Example | Notes |
| --- | --- | --- |
| `VITE_SERVER_URL` | `wss://campusquest-prod.up.railway.app` | Injected at build time |

### Server

| Var | Example | Notes |
| --- | --- | --- |
| `PORT` | `2567` | Platform often sets this |
| `NODE_ENV` | `production` | |
| CORS origin | client URL | Allow the Vercel domain |

## Build commands (target)

```bash
# Client
cd client && yarn build   # output dist/ → Vercel

# Server
cd server && yarn build && yarn start
```

Root `yarn start` remains the local concurrent dev path.

## Health

Expose `GET /health` on the server for uptime checks.

## Rollback

- Client: redeploy previous Vercel deployment
- Server: Railway rollback to previous release
- Keep `VITE_SERVER_URL` pointing at the live server; avoid cross-wiring staging/prod URLs

## Domains (suggested)

- `campusquest.lgs…` or project Vercel URL for client
- Railway-provided hostname for WS until custom domain is ready

## Checklist before going live

- [ ] HTTPS / WSS only
- [ ] CORS locked to production client origin
- [ ] Desktop gate + help modal present
- [ ] Smoke path from TESTING.md green
- [ ] Staff know how to edit `client/src/content/`
