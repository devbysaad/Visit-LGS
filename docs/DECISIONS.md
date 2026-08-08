# Decisions — CampusQuest

Append-only ADR log. Newest at the bottom.

---

## ADR-001 — Fork and strip SkyOffice (not greenfield)

- **Date:** 2026-08-03
- **Decision:** Fork upstream `kevinshen56714/SkyOffice`, then delete PeerJS/video/screen-share/whiteboard/custom-room code in one Phase 1 pass.
- **Rationale:** Colyseus↔Phaser↔Redux bridge and movement netcode are already solved; re-deriving costs weeks.
- **Revisit if:** Strip-down shows video inseparably entangled with movement (unexpected).

## ADR-002 — No video, screen share, or whiteboards in v1

- **Date:** 2026-08-03
- **Decision:** Drop PeerJS and related UI entirely.
- **Rationale:** Orientation does not need them; live video among school-age users creates consent/moderation obligations we are not equipped to meet.
- **Revisit if:** School explicitly requests moderated AV with policy + staffing.

## ADR-003 — Documentation before application code

- **Date:** 2026-08-03
- **Decision:** Phase 0 docs + Cursor rules before feature code.
- **Rationale:** Map and content are expensive to redo; MAP_SPEC prevents wasted art.
- **Revisit if:** Never — keep docs current instead.

## ADR-004 — One map, one scene, one Colyseus room

- **Date:** 2026-08-03
- **Decision:** Single `campus` room and `CampusScene`; interiors are zones on one grid.
- **Rationale:** Removes scene transitions and cross-room migration from v1.
- **Revisit if:** Campus scale forces streaming multiple maps.

## ADR-005 — Client-authoritative movement

- **Date:** 2026-08-03
- **Decision:** Client sends position; server relays; peers lerp.
- **Rationale:** No competitive stake; server-auth triples netcode cost.
- **Revisit if:** Cheating/griefing becomes a real problem.

## ADR-006 — No accounts, no database

- **Date:** 2026-08-03
- **Decision:** Name + avatar at join; quest progress in `localStorage` keyed by content version.
- **Rationale:** Removes auth, PII storage, and privacy surface for an orientation tool.
- **Accepted cost:** Clearing browser data loses hunt progress.
- **Revisit if:** School requires tracked completion per student ID.

## ADR-007 — Content in data files

- **Date:** 2026-08-03
- **Decision:** Buildings, NPCs, quests live under `client/src/content/`, mirrored by `docs/CONTENT.md`.
- **Rationale:** Success criterion 5 — staff edit without touching game code.
- **Revisit if:** Non-technical staff need a CMS (then add a thin admin later).

## ADR-008 — Vercel client + Railway server (Singapore)

- **Date:** 2026-08-03
- **Decision:** Static client on Vercel; Colyseus on Railway near region.
- **Rationale:** WebSockets need a persistent Node host; Singapore latency better for PK than US.
- **Revisit if:** School provides on-prem or alternate cloud with WS support.

## ADR-009 — 32×32 tiles, camera zoom 1.5

- **Date:** 2026-08-03
- **Decision:** Fixed grid; zoom 1.5 with optional 2.0 fallback.
- **Rationale:** Matches SkyOffice/LimeZu assets; consistent MAP_SPEC.
- **Revisit if:** Inherited tilesets differ — record actual size in DESIGN.md during Phase 1.

## ADR-010 — Desktop only with gate screen

- **Date:** 2026-08-03
- **Decision:** No mobile gameplay; show an explicit unsupported gate.
- **Rationale:** Touch ports of this genre are poor; better to refuse than ship broken UX.
- **Revisit if:** Dedicated mobile redesign is funded.

## ADR-011 — Gudwal campus; no official public map

- **Date:** 2026-08-03
- **Decision:** Target LGS Wah Cantt Gudwal Rd campus; greybox from satellite + staff/student notes; CONTENT placeholders until confirmed.
- **Rationale:** Research found address and satellite only — no labelled official layout PDF.
- **Revisit if:** School supplies an official site plan.

## ADR-012 — Procedural placement for building/npc/spawn objects on the greybox map

- **Date:** 2026-08-03
- **Decision:** Phase 2 placed `spawns`/`buildings`/`npcs` Tiled objects via a script (walkability
  flood-fill + farthest-point sampling over the reused SkyOffice floor) instead of hand-placing
  in Tiled, since there's no real Gudwal floorplan yet (see ADR-011) and the office map is a
  temporary stand-in.
- **Rationale:** Guarantees every object lands on walkable, non-colliding, mutually-reachable
  tiles without manual trial and error on a map that will be replaced.
- **Revisit if:** A hand-authored or real-floorplan-derived map replaces the SkyOffice greybox —
  re-place objects in Tiled directly at that point.

## ADR-021 — Orientation clue hunt (eggs) without wallet / NUST UI

- **Date:** 2026-08-07
- **Decision:** Port `__sa` scavenger Q&A mechanics (approach → guess → reveal, first-finder, Codex) into CampusQuest with **server-only answers**, in-memory claims (no Mongo/wallet), and **6 LGS-oriented clues** on a compact map. UI uses CampusQuest mint/Syne/DM Sans — never NUST navy/gold/Georgia. Skip PeerJS, whiteboards, multi-room interiors, and mobile controls.
- **Rationale:** Feature parity on the hunt loop students care about, without violating AGENTS.md non-goals or copying NUST branding.
- **Accepted cost:** Clue copy is placeholder / `needsLocalCheck` until Gudwal staff verify facts.
- **Revisit when:** School supplies official orientation FAQ answers.

## ADR-020 — Interior islands + door portals (supersedes hollow footprints in ADR-019)

- **Date:** 2026-08-05
- **Decision:** Keep one Phaser tilemap and one Colyseus `campus` room, but place building interiors as **separate islands** east of outdoor campus, separated by void. `areas` object layer defines camera/physics bounds; `portals` define Press-E enter/exit with fade + teleport. `Player.areaId` syncs so other players only render in the same area. Ambient walkers (`ambient` layer) are local-only décor.
- **Rationale:** Hollow outdoor footprints still showed the whole campus after a short fade — that broke the “I’m inside the library/classroom” feel. Island + camera bounds make outside disappear without multiple Phaser scenes or rooms.
- **Accepted cost:** Larger map (void padding); generator must keep outdoor doorsteps and interior exits in sync.
- **Revisit when:** Real Gudwal floorplans need hand-authored `.tmx` interiors — keep `areaId` / `portalId` / `roomId` stable.

## ADR-019 — Enterable building interiors + room zones

- **Date:** 2026-08-05
- **Decision:** Campus buildings are hollow walkable footprints (walls + door gap) on the same map. Interior `rooms` object layer + `content/rooms.ts` drive Press-E room info. Doorway `buildings` triggers still open building overview / library shelf / notice board.
- **Update (2026-08-05):** Superseded for enter UX by **ADR-020** (interior islands + portals). Room/board content and Press-E room info remain.
- **Rationale:** Orientation needs to “visit” Library rooms, classrooms/labs, and Admin waiting/office/balcony — not only outdoor info cards.
- **Accepted cost:** Generator layout is still fictional; denser props/furniture TBD.
- **Revisit when:** Real Gudwal floorplans arrive — keep `roomId`s stable while redrawing partitions.

## ADR-018 — Prisma ORM for Supabase Postgres profiles

- **Date:** 2026-08-05
- **Decision:** Use Prisma 6 (`DATABASE_URL` transaction pooler + `DIRECT_URL` session pooler) to own the `profiles` table and Clerk auth upsert path (`server/prisma.ts`). Prefer Prisma over `@supabase/supabase-js` service-role writes for typed access.
- **Rationale:** User-provided Supabase pooler URLs; Prisma gives migrations/`db push` and a single typed client for the Express auth sync.
- **Accepted cost:** Must keep both pooler URLs in `.env`; schema lives in `prisma/schema.prisma` (SQL in `supabase/schema.sql` is reference only).
- **Revisit when:** Moving fully off Supabase hosting or needing Supabase Realtime/RLS from the client.

## ADR-017 — Library reader + shared notice board

- **Date:** 2026-08-05
- **Decision:** Press E on `library` opens a shelf UI with open-book page turning (content in `books.ts`). Press E on `notice-board` opens staff pins (`notices.ts`) plus student notes synced through Colyseus `noticePosts` and persisted to `server/data/notice-board.json`.
- **Rationale:** Orientation needs readable campus material and a lightweight shared announcement surface without shipping freehand whiteboard/WebRTC from SkyOffice.
- **Accepted cost:** Student notes are moderated lightly (length + word filter) and are not a moderated CMS; file persist is local to the server process host.
- **Revisit when:** Staff want moderated publishing, photo notices, or DB-backed history — move posts to Supabase then.

## ADR-016 — Clerk auth + Supabase Postgres profiles

- **Date:** 2026-08-03
- **Decision:** Replace custom email/password with Clerk hosted sign-in; persist player profiles in Supabase Postgres (`profiles.clerk_id`).
- **Update (2026-08-05):** Profile writes use **Prisma** (`DATABASE_URL` / `DIRECT_URL`) — see ADR-018.
- **Rationale:** Production-ready identity without building password reset/MFA; school can enable Google/magic-link in Clerk without code changes.
- **Accepted cost:** Requires env setup (see docs/ENV.md). App shows a setup hint if `VITE_CLERK_PUBLISHABLE_KEY` is missing.
- **Revisit when:** School mandates student-ID SSO — add allow-list / domain restriction in Clerk or Postgres.

## ADR-015 — Email/password auth without college IDs (interim)

- **Date:** 2026-08-03
- **Status:** Superseded by ADR-016 (Clerk + Supabase).
- **Decision:** ~~Add professional email + password signup/login~~ (removed).
- **Rationale:** Was an interim before Clerk keys were available.

## ADR-014 — Dummy LGS campus map until official layout exists

- **Date:** 2026-08-03
- **Decision:** Ship a generated “typical Pakistani college” outdoor map (`tools/gen_lgs_campus.py`) with gate, admin/fee, classrooms, labs, canteen, library, sports field, and content-matched zones — not a surveyed Gudwal plan.
- **Rationale:** No public official site map; blocking on real geometry stalls orientation features. Dummy map keeps building/NPC/quest loops testable.
- **Accepted cost:** Spatial accuracy is fictional; staff will recognise it as provisional.
- **Revisit when:** Satellite greybox or staff sketch arrives — then replace generator footprints, keep the same `buildingId`s.

## ADR-013 — Interactable interface unifies sprite items and zone triggers

- **Date:** 2026-08-03
- **Decision:** `BuildingZone`/`NpcZone` (Phaser `Zone`, no or minimal visible sprite) implement
  the same `Interactable` shape (`itemType`, `depth`, `clearDialogBox`, `onOverlapDialog`) as the
  existing sprite-based `Item` (chairs, vending machines), rather than forcing zones to extend
  the Sprite-based `Item` class.
- **Rationale:** Avoids requiring a texture/frame for invisible trigger rectangles while letting
  `PlayerSelector`/`MyPlayer` treat "what does E do right now" uniformly.
- **Revisit if:** Buildings/NPCs need their own visible on-map sprite/marker — extend
  `Interactable`, not `Item`.

## ADR-022 — Multi-storey blocks are stacked areas, not a new scene

- **Date:** 2026-08-08
- **Decision:** Each floor of Academic Block A/B is its own `areaId` and its own interior island on the single map. The stairwell is an ordinary portal pair (`stairs-up-*` / `stairs-down-*`) between the two floor areas.
- **Rationale:** Keeps ADR-004 (one map, one scene, one room) intact and reuses the portal/camera-bounds machinery from ADR-020 with no new systems. Presence filtering by `areaId` already hides players on the other floor.
- **Revisit if:** We need players on different floors to see or hear each other, or a block grows past ~3 floors and the island grid becomes unwieldy.

## ADR-023 — Drivable campus car reuses the player body

- **Date:** 2026-08-08
- **Decision:** Press E beside the parked car to drive it. While driving, the player sprite hides, the car sprite is glued to the player position, and walk speed rises from 200 to 430. The player's own Arcade body stays the collider; the car's static body is disabled while driven.
- **Rationale:** A second physics body would need duplicate colliders against the ground layer, other players and every static group. Reusing the player body means driving inherits all existing collision and world-bounds behaviour for free.
- **Consequence:** A new `riding` boolean on the Colyseus `Player` schema tells other clients to draw a car instead of a walking sprite. The car is outdoor-only and its art is baked procedurally at boot (`client/src/items/CarTextures.ts`) rather than shipped as a sprite sheet.
- **Revisit if:** We want passengers, collisions that differ from walking, or vehicles inside interiors.

