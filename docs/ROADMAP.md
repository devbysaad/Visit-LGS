# Roadmap — CampusQuest

Estimates assume part-time work. Total **5–7 weeks**. Long poles: Phase 2 (map) and Phase 5 (NPCs/hunt).

## Phase 0 — Documentation (2–3 days)

**Goal:** Lock vision, contracts, and agent rules before any game code.

**Deliverables**
- `README.md`, `AGENTS.md`
- All files under `docs/`
- `.cursor/rules/*.mdc`

**Exit:** Vision, PRD, and MAP_SPEC reviewed; no application code required yet.

## Phase 1 — Scaffold and strip (3–4 days)

**Goal:** Runnable fork with video/rooms removed and campus vocabulary.

**Deliverables**
- Fork upstream SkyOffice into this repo layout
- Baseline run unmodified once
- One strip-down commit: remove PeerJS/WebRTC, screen share, whiteboard, custom-room lobby
- Rename room/schema/scene to campus terms
- Normalise tree to `client/` + `server/` + `types/`

**Exit:** Two browser tabs join one `campus` room, move, and chat; zero PeerJS imports; typecheck clean.

## Phase 2 — LGS Gudwal campus map (1–2 weeks)

**Goal:** Walkable pixel campus approximating Gudwal Rd footprints.

**Deliverables**
- Satellite greybox → decorate → collision → object triggers
- Map validation: every `buildingId` matches content
- Commit `.tmx` source + exported `.json`

**Reference:** Google Maps satellite of Sir Syed Rd / Main Gudwal Rd; staff sketch for interiors. No official public layout PDF exists.

**Exit:** Campus walkable end-to-end; triggers resolve; cross-map time feels tolerable.

## Phase 3 — Campus interaction layer (3–4 days)

**Goal:** Buildings and kiosks work with real content.

**Deliverables**
- `InteractiveZone`, `BuildingZone`, in-world prompts
- React building modal wired to `content/buildings.ts`
- Bench sitting; notice-board kiosks

**Exit:** Every building opens the correct modal; movement locked while modal open.

## Phase 4 — Multiplayer hardening (3–4 days)

**Goal:** Stable presence under orientation load.

**Deliverables**
- Position rate tuning + OtherPlayer lerp
- Join/leave edge cases; nameplates/bubbles across clients
- Name/chat length + light profanity filter
- Disconnect cleanup; 10+ client load check

**Exit:** ~20 clients acceptable smoothness; no leaked sprites after disconnects.

## Phase 5 — NPCs and scavenger hunt (1–1.5 weeks)

**Goal:** Orientation spine.

**Deliverables**
- NPC idle/facing + dialogue advance on E/Space
- Quest engine, objective tracker, quest log (J), toasts, completion screen
- `localStorage` persistence keyed by content version

**Exit:** First-time player finishes hunt ≤15 minutes; progress survives refresh.

## Phase 6 — Polish and deploy (4–5 days)

**Goal:** Live orientation URL.

**Deliverables**
- Loading progress, help modal, desktop gate
- Ambient audio (muted by default)
- Performance pass; browser matrix from TESTING.md
- Deploy client (Vercel) + server (Railway, Singapore)
- Two playtest rounds with incoming students + fix pass

**Exit:** Live URL; success criteria 1–4 measured; README handoff for staff content edits.
