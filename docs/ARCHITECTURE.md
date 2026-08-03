# Architecture — CampusQuest

## Monorepo layout

```
lgs-campusquest/
├── package.json                 # root: dev (server+client), typecheck
├── types/                       # shared contracts
│   ├── ICampusState.ts
│   ├── Messages.ts
│   └── Content.ts
├── server/
│   ├── index.ts                 # Colyseus + Express, /health
│   └── rooms/
│       ├── CampusRoom.ts
│       ├── schema/CampusState.ts
│       └── commands/
└── client/
    ├── index.html
    ├── vite.config.ts
    ├── public/assets/
    │   ├── maps/                # campus.json (+ .tmx sources)
    │   ├── tilesets/
    │   ├── characters/
    │   ├── ui/
    │   └── images/buildings/
    └── src/
        ├── main.tsx
        ├── PhaserGame.ts
        ├── scenes/              # Boot, Preloader, Background, CampusScene
        ├── characters/          # Player, MyPlayer, OtherPlayer, Npc
        ├── zones/               # InteractiveZone, BuildingZone, NpcZone, Bench
        ├── anims/
        ├── events/phaserEvents.ts
        ├── services/            # Network.ts, QuestService.ts
        ├── stores/              # User, Room, Chat, Building, Quest
        ├── components/          # Join, HUD, Chat, Modals, …
        └── content/             # buildings.ts, npcs.ts, quests.ts
```

## Scene flow

`Boot` → `Preloader` (assets + progress to React) → `Background` (pixel backdrop behind join UI) → React JoinScreen (name + avatar) → `Network.joinCampusRoom()` → `CampusScene` (tilemap, spawn at `spawn_gate`, camera follow with `roundPixels`, register object-layer zones).

**One gameplay scene only.**

## Phaser ↔ React bridge

**Invariant:** Phaser never imports React and never touches Redux.

1. Phaser emits typed events on the `phaserEvents` singleton (`client/src/events/EventCenter.ts`):
   `BUILDING_INTERACT`, `NPC_INTERACT`, `QUEST_LOG_TOGGLE`, plus the Phase 1 player/chat events.
2. `client/src/events/subscribeGameEvents.ts` is the one subscription module that maps those
   events → Redux dispatches (`BuildingStore.openBuilding`, `NpcStore.openNpc`,
   `QuestStore.completeQuestStepIfMatch` / `toggleQuestLog`). It's wired once from `index.tsx`,
   after the store exists.
3. React reads Redux; calls back only via `Network` methods and a small `GameBridge` for input focus.

`BuildingZone` and `NpcZone` (`client/src/zones/`) are Phaser `Zone`s (no visible sprite for
buildings; NPCs render an idle character sprite) that implement a shared `Interactable`
interface (`client/src/items/Interactable.ts`) alongside the pre-existing sprite-based `Item`
(chairs, vending machines) — this lets `PlayerSelector`/`MyPlayer` treat "what E currently does"
uniformly regardless of whether the target is a sprite or a Zone.

Note: some Phase 1 code (`MyPlayer.ts`, `CampusScene.ts` chat handlers) still dispatches to
Redux directly, inherited from the SkyOffice strip — treat that as known debt, not a pattern to
copy; new Phaser code should emit events per the invariant above.

**Consequences**
- When a modal opens or chat input is focused, disable Phaser keyboard capture (or the player walks behind UI).
- Never dispatch Redux on every movement tick — React must stay off the per-frame path.

## Colyseus

- Room type: `campus`, `joinOrCreate`, `maxClients: 25`
- State: `MapSchema<Player>` (`name`, `x`, `y`, `anim`, `avatarKey`) + bounded `ArraySchema<ChatMessage>`
- Messages: `UPDATE_PLAYER`, `UPDATE_PLAYER_NAME`, `ADD_CHAT_MESSAGE`, join/leave signals
- **Movement is client-authoritative** — client sends position; server relays; `OtherPlayer` lerps
- Quests/NPC/building progress are **client-only** (`localStorage` + content version) — server is presence + chat only

## Content pipeline

`docs/CONTENT.md` is the human source of truth. Runtime mirrors:

- `client/src/content/buildings.ts`
- `client/src/content/npcs.ts`
- `client/src/content/quests.ts`

Staff edit these files; no component hardcoded strings for campus copy.

## Map pipeline

Author in Tiled → export JSON → `client/public/assets/maps/campus.json`. Commit `.tmx` + `.json`. Layer names and object properties are frozen in [MAP_SPEC.md](MAP_SPEC.md). Validate every `buildingId` against content on load.

## How to add a new interactive building (end-to-end)

1. Add a row to `docs/CONTENT.md` and `client/src/content/buildings.ts` with a stable `id`.
2. Drop a photo in `client/public/assets/images/buildings/{id}.jpg` (if any).
3. In Tiled, add an object on the `buildings` object layer with custom property `buildingId` = that id.
4. Export map JSON; commit `.tmx` + `.json`.
5. Run the client — walk into the zone, press E, confirm modal text.
6. If the building is a hunt target, add/update a step in `quests.ts` / CONTENT.md.

No Phaser scene rewrite and no Redux slice required for a content-only building.

## Explicitly not in v1

PeerJS/WebRTC, screen share, whiteboards, proximity voice, custom rooms, accounts/DB, mobile, in-app map editor, i18n.
