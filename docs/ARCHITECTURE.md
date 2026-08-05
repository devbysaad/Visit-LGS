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
- State: `MapSchema<Player>` (`name`, `x`, `y`, `anim`, `readyToConnect`, `areaId`) + bounded `ArraySchema<ChatMessage>` + bounded `ArraySchema<NoticePost>`
- Messages: `UPDATE_PLAYER`, `UPDATE_PLAYER_NAME`, `UPDATE_PLAYER_AREA`, `ADD_CHAT_MESSAGE`, `ADD_NOTICE_POST`, join/leave signals
- **Movement is client-authoritative** — client sends position; server relays; `OtherPlayer` lerps
- **Area visibility:** peers in a different `areaId` are hidden (same Colyseus room, local filter)
- Quests/NPC/building progress are **client-only** (`localStorage` + content version)
- Shared notice-board student posts are **room state + file persist** (`server/data/notice-board.json`) so later joiners and restarts still see them
- Staff notice pins are **content-only** (`client/src/content/notices.ts`)

## Content pipeline

`docs/CONTENT.md` is the human source of truth. Runtime mirrors:

- `client/src/content/buildings.ts`
- `client/src/content/npcs.ts`
- `client/src/content/quests.ts`
- `client/src/content/books.ts` (library shelf)
- `client/src/content/notices.ts` (staff pins on the notice board)

Staff edit these files; no component hardcoded strings for campus copy.

Special building UIs:

- `library` → `LibraryModal` (shelf + open-book page turn)
- `notice-board` → `NoticeBoardModal` (staff pins + shared student posts)
- other buildings → `BuildingModal`

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

PeerJS/WebRTC, screen share, freehand whiteboards, proximity voice, custom rooms, mobile, in-app map editor, i18n.

(Accounts/DB: Clerk + Supabase profiles are allowed per ADR-016. Shared notice text is room/file state, not a drawing canvas.)
