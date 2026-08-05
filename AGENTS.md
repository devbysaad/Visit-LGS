# Agent instructions — CampusQuest

Read this before changing code or docs in this repo.

## What this project is

**CampusQuest** is a 2D multiplayer campus explorer for LGS Wah Cantt (Gudwal), adapted from SkyOffice. New students walk a pixel campus, open building info, talk to NPCs, and complete a scavenger hunt.

## Non-negotiables

- **No PeerJS / video / screen share / whiteboards** in v1.
- **No accounts or database** — identity is name + avatar; quest progress in `localStorage`.
- **One map, one Phaser gameplay scene, one Colyseus room** (`campus`).
- **All campus copy lives in data files** under `client/src/content/` — never hardcoded in components or scenes.
- **Desktop only** — ship a desktop gate, do not half-port touch.
- **Docs before behaviour changes** — update the relevant `docs/` file in the same PR as the code change.

## Stack map

| Area | Path | Notes |
| --- | --- | --- |
| Phaser scenes | `client/src/scenes/` | Boot → Preloader → Background → CampusScene |
| Characters | `client/src/characters/` | MyPlayer, OtherPlayer, Npc |
| Zones | `client/src/zones/` | BuildingZone, PortalZone, NpcZone, RoomZone, BoardZone |
| React UI | `client/src/components/` | Join, HUD, Chat, Modals |
| Redux | `client/src/stores/` | User, Room, Chat, Building, Quest |
| Content | `client/src/content/` | buildings, rooms, npcs, quests, books, notices |
| Bridge | `client/src/events/phaserEvents.ts` | Phaser emits; React never imported into Phaser |
| Server room | `server/rooms/CampusRoom.ts` | Presence + chat + shared notice posts |
| Shared types | `types/` | Only shared client/server contract |

## Phaser ↔ React rule

Phaser **never** imports React or touches Redux. Emit typed events on `phaserEvents`. A subscription module dispatches to Redux. When a modal or chat input is focused, disable Phaser keyboard capture.

## Map / content IDs

Every Tiled building trigger `buildingId` must exist in `content/buildings.ts`. Same for NPC and quest target IDs. Mismatches must fail validation loudly.

## Design reference

Screenshots in `desingInspo/` document the SkyOffice look we adapt (dark navy panels, mint `#33ac96` accent, in-world prompts and chat bubbles). Full tokens: `docs/DESIGN.md`.

## Further reading

- Vision / non-goals: `docs/VISION.md`
- Architecture walkthrough: `docs/ARCHITECTURE.md`
- Map contract: `docs/MAP_SPEC.md`
- Locked ADRs: `docs/DECISIONS.md`
