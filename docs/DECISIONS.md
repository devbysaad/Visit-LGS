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

## ADR-016 — Clerk auth + Supabase Postgres profiles

- **Date:** 2026-08-03
- **Decision:** Replace custom email/password with Clerk hosted sign-in; persist player profiles in Supabase Postgres (`profiles.clerk_id`). Server verifies Clerk JWTs and upserts with the service role key.
- **Rationale:** Production-ready identity without building password reset/MFA; school can enable Google/magic-link in Clerk without code changes. Supabase gives managed Postgres for future quests/analytics.
- **Accepted cost:** Requires env setup (see docs/ENV.md). App shows a setup hint if `VITE_CLERK_PUBLISHABLE_KEY` is missing.
- **Revisit when:** School mandates student-ID SSO — add allow-list / domain restriction in Supabase or Clerk.

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
