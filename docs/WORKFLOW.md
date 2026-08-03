# Workflow — CampusQuest

## Environment

- Node.js LTS 20+
- Yarn
- Tiled Map Editor (map work)
- Desktop Chrome for daily playtest

## Commands

```bash
yarn              # install root deps
yarn dev          # server + client together (recommended)
yarn start        # Colyseus server only → :2567
yarn client       # Vite client only → :5173
yarn gen-map      # regenerate dummy LGS campus map
yarn validate-map # check buildingId/npcId contract
cd client && yarn typecheck  # if configured; else yarn build
```

## Branch naming

| Prefix | Use |
| --- | --- |
| `feat/` | New behaviour |
| `fix/` | Bug fix |
| `map/` | Tiled / tileset only |
| `docs/` | Documentation / rules |
| `chore/` | Tooling, deps |

## Commits

Conventional Commits: `feat:`, `fix:`, `docs:`, `map:`, `chore:`, `refactor:`.

Focus the subject on **why**. Example: `feat: add building modal from content ids`.

## Pull requests

- Link the PRD story id when applicable (`US-05`)
- Include screenshots for UI
- For map PRs: note which `buildingId`s changed
- DoD checklist below must pass

## Definition of Done

- [ ] Typecheck clean
- [ ] No unexpected console errors on smoke path
- [ ] Manual smoke from TESTING.md for touched area
- [ ] Docs updated in the **same** PR as behaviour/content change
- [ ] Map `.tmx` and exported `.json` committed together
- [ ] Content ids match map properties

## Content edits (staff)

1. Edit `docs/CONTENT.md`
2. Mirror `client/src/content/*.ts`
3. If ids change, update Tiled objects and re-export
4. Bump `contentVersion` in quests when hunt steps change

## Agent / AI work

Follow `AGENTS.md` and `.cursor/rules/`. Do not reintroduce PeerJS, video, whiteboards, or custom rooms.
