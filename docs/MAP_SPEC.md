# Map specification — CampusQuest

Contract for the LGS Gudwal Tiled map. Violating this breaks Phaser load or content binding.

## Files

| File | Role |
| --- | --- |
| `client/public/assets/maps/campus.tmx` | Authoring source (commit) |
| `client/public/assets/maps/campus.json` | Phaser runtime (commit) |
| Tileset images | Under `client/public/assets/tilesets/` |

## Grid

- Tile size: **32×32** (never mix sizes)
- Orientation: orthogonal, right-down
- One campus map for v1 (outdoor + interior islands on one grid; camera bounds per `areas`)


## Export settings (Tiled)

- Format: JSON
- Embed tilesets: **off** (external tileset refs resolving under `assets/tilesets/`)
- Layer data: CSV
- Export after every meaningful map change; commit `.tmx` and `.json` together

## Tile layers (draw order bottom → top)

| Name | Purpose |
| --- | --- |
| `Ground` | Floor, grass, paths base |
| `Decor` | Paths accents, rugs, non-colliding props |
| `Collision` | Walls / blockers; tiles with `collides: true` |
| `AbovePlayer` | Roofs, tree tops, overhangs drawn above the player |

Phaser enables collision **only** on `Collision` via `setCollisionByProperty({ collides: true })`.

## Object layers

| Layer name | Object type / use | Required custom properties |
| --- | --- | --- |
| `spawns` | Spawn points | `name` = `spawn_gate` (required). Optional later: `spawn_admin`, etc. |
| `areas` | Camera/physics bounds rectangles | `areaId` (`outdoor`, `library`, `classrooms`, `admin`, `canteen`), optional `displayName` |
| `portals` | Door enter/exit triggers | `portalId`, `targetArea`, `spawnTileX`, `spawnTileY`, `label` |
| `buildings` | Building doorway info rectangles | `buildingId` (string, must match `content/buildings.ts`) |
| `rooms` | Interior room rectangles | `roomId` (string, must match `content/rooms.ts`) |
| `boards` | Writable classroom/notice boards | `boardId` |
| `npcs` | NPC anchor points | `npcId` (string, must match `content/npcs.ts`) |
| `ambient` | Local-only student/staff walkers | `ambientId`, `areaId` |
| `benches` | Sit targets | optional `benchId` |
| `kiosks` | Notice boards | `buildingId` or `kioskId` matching content |

Object sizes should be large enough for comfortable overlap (~1–2 tiles padding around doors).

## ID naming rules

- Lowercase kebab or snake: `admin-office`, `fee-counter`, `science-lab`
- Same id string in: Tiled property, `buildings.ts` / `npcs.ts` key, quest `targetId`
- Never rename an id without updating map + content + quests in one change

## Validation (Phase 2+)

On map load (dev) or CI script:

1. Every `buildings` object has non-empty `buildingId`
2. Every `buildingId` exists in content
3. Every content building used as a quest target exists on the map
4. `spawn_gate` exists exactly once
5. Fail loudly on mismatch (throw / console error in boot)

**Implemented:** `client/src/utils/validateMapContent.ts` runs from `CampusScene.create()` right
after the tilemap loads — throws in dev, warns in production. `scripts/validate-map.mjs` is a
Node-only mirror (no Phaser boot required) for CI/local checks; run with `yarn validate-map`.

## Current map status (Phase 2 greybox)

`client/public/assets/map/map.json` is still the reused SkyOffice office floorplan
(40×30, one connected walkable region) — no `.tmx` exists yet, JSON is the only source. The
`Computer` and `Whiteboard` object layers (and their tilesets) were removed as unused. `spawns`,
`buildings`, `npcs`, and an empty `benches` object layer were added; positions were chosen
programmatically (farthest-point spread across walkable, non-occupied tiles) rather than
hand-placed in Tiled, since there's no real floorplan yet (see ADR-011). Existing `Chair` objects
still work as sit targets and satisfy the "benches" need for now.

The same file is duplicated at `client/public/assets/maps/campus.json` to satisfy this spec's
file table; `Bootstrap.ts` still loads from `assets/map/map.json` — update both paths together
if that changes.

Re-running the placement script or hand-editing in Tiled is expected once a real Gudwal floorplan
or hand-authored map exists; treat current coordinates as greybox placeholders.

## Current dummy map

Until a real Gudwal plan exists, use the generator:

```bash
yarn gen-map    # tools/gen_lgs_campus.py → assets/map/map.json + assets/maps/campus.json
yarn validate-map
```

Layout (fictional, typical college): south **main gate** → spine path → **admin / fee / notice** → plaza → **classrooms** → **library** → NW **sports**. Enterable buildings are **solid outdoor shells**; Press E at the door fades into a **separate interior island** east of campus (void gap). Camera bounds (`areas`) hide everything outside that building until you exit.

## Greybox guidance (real Gudwal later)

No official public layout PDF. Process:

1. Trace satellite footprint (Main Gudwal Rd / Sir Syed Rd) for outer walls and courtyards
2. Update footprints in `tools/gen_lgs_campus.py` (keep the same `buildingId`s / `areaId`s / `portalId`s)
3. Playtest scale before decorating
4. Decorate last

If crossing the map feels long, **shrink before decorating further**.

## Camera

- Follow player with `roundPixels: true`
- Zoom **1.5** (see DESIGN.md)
- Bounds = active `areas` rectangle so outdoor/other buildings cannot scroll into view while indoors
