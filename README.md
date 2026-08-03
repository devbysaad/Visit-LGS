# CampusQuest — LGS College

A browser-based 2D pixel-art walkthrough of the **LGS Wah Cantt (Gudwal)** campus for new-student orientation.

Pick a name and avatar, spawn at the main gate, explore with WASD, press **E** near buildings and NPCs, complete a scavenger hunt, and chat with other students in real time.

> **Desktop only.** Mobile browsers are not supported in v1.

## Stack

- **Phaser 3** — game world, movement, collision, tilemaps
- **Colyseus** — multiplayer WebSocket sync
- **React / Redux** — UI overlay (chat, modals, HUD)
- **TypeScript** — client and server
- **Tiled** — campus map authoring

Built by adapting [SkyOffice](https://github.com/kevinshen56714/SkyOffice) (MIT). Pixel art credit: [LimeZu](https://limezu.itch.io/).

## Prerequisites

- Node.js LTS (20+)
- Yarn

## Quick start

```bash
# One command — server (:2567) + client (:5173)
yarn && yarn dev
```

Or separately:

```bash
yarn start          # Colyseus server
yarn client         # Vite client
```

### Auth (Clerk + Supabase)

| Email/password | Removed — use Clerk |
| --- | --- |
| Setup guide | [docs/ENV.md](docs/ENV.md) |
| SQL schema | [supabase/schema.sql](supabase/schema.sql) |

Copy `.env.example` → `.env` and `client/.env.example` → `client/.env`, then add your Clerk + Supabase keys.

Regenerate the dummy campus map anytime:

```bash
yarn gen-map && yarn validate-map
```

## Controls

| Key | Action |
| --- | --- |
| W A S D / Arrows | Move |
| E | Interact (building, NPC, bench, notice board) |
| Enter | Open / send chat |
| Esc | Close topmost UI layer |
| J | Toggle quest log |
| ? | Help / controls |

## Docs

| Doc | Purpose |
| --- | --- |
| [docs/VISION.md](docs/VISION.md) | Product vision, audience, non-goals |
| [docs/PRD.md](docs/PRD.md) | User stories and acceptance criteria |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased delivery plan |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual and interaction design |
| [docs/MAP_SPEC.md](docs/MAP_SPEC.md) | Tiled map contract |
| [docs/CONTENT.md](docs/CONTENT.md) | Buildings, NPCs, quest copy |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Dev workflow |
| [docs/TESTING.md](docs/TESTING.md) | Manual QA scripts |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting and env |
| [docs/ASSETS.md](docs/ASSETS.md) | Asset inventory and licences |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision log |
| [AGENTS.md](AGENTS.md) | Guidance for AI coding agents |

## Licence

MIT — retain SkyOffice and LimeZu attribution when redistributing.

## Staff: editing campus copy

Orientation text lives in `client/src/content/` (`buildings.ts`, `npcs.ts`, `quests.ts`), mirrored by [docs/CONTENT.md](docs/CONTENT.md). Edit those files — do not hardcode copy in React components.
# Visit-LGS
