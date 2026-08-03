# Testing — CampusQuest

Automated Phaser tests are low value for v1. Prefer a disciplined manual QA script.

## Smoke path (every release candidate)

1. Cold load — progress UI appears; playable &lt;8s on mid laptop
2. Desktop gate does not block a normal desktop viewport
3. Enter name + avatar → join
4. Spawn at main gate (`spawn_gate`)
5. Walk with WASD; animations correct
6. Collide with a wall — no tunneling
7. Enter each building zone → Press E → modal content matches CONTENT.md
8. Talk to each NPC → advance lines → close
9. Complete scavenger hunt end-to-end ≤15 minutes
10. Press J — quest log accurate; toast on step complete
11. Open chat (Enter), send message — panel + in-world bubble
12. Second browser tab: both see each other move and chat
13. Refresh mid-hunt — progress restores
14. Disconnect second tab — sprite removed; no leftovers

## Multiplayer checklist

- [ ] Two clients, same room, nameplates visible
- [ ] Rapid movement — no lasting rubber-band
- [ ] Join/leave spam — no duplicate sprites
- [ ] Chat filter rejects empty / too-long / blocked words
- [ ] Optional: 10+ tabs or bot clients — room stays responsive

## Browser matrix (Phase 6)

| Browser | Desktop |
| --- | --- |
| Chrome (latest) | Required pass |
| Edge (latest) | Required pass |
| Safari (latest macOS) | Required pass |
| Firefox (latest) | Best-effort |

Mobile: confirm desktop-only gate shows; do not test as supported gameplay.

## Map / content validation

- [ ] Every Tiled `buildingId` / `npcId` exists in content
- [ ] Every hunt `targetId` exists on the map
- [ ] `spawn_gate` present once
- [ ] Missing id fails loudly in dev console

## Playtest protocol (Phase 6)

1. Recruit real incoming students (or recent juniors)
2. Give **no** verbal instructions beyond the URL
3. Time: first building found; hunt complete
4. Note confusion points; fix; second round
5. Record against VISION success criteria 1–4
