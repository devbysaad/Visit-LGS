# Vision — CampusQuest

## Problem

Orientation day at LGS Wah Cantt (Gudwal) is overwhelming. Campus layout is opaque to new students and parents. Paper maps and verbal tours do not stick.

## Solution

A browser-based 2D pixel-art walkthrough of the Gudwal campus. A new student picks a name and avatar, spawns at the main gate, walks with WASD, learns buildings via **Press E** info panels, talks to stationary NPCs, and completes a scavenger hunt. Other real students appear as live avatars with nameplates and text chat.

## Audience

- **Primary:** Incoming LGS Wah Cantt students during pre-term orientation
- **Secondary:** Parents; school open-day / marketing use
- **Not for v1:** Mobile users (desktop-keyboard game with an explicit gate screen)

## Campus focus

**LGS Wah Cantt — Gudwal Road campus**  
Address: Sir Syed Road, 26-27 Area Chowk, Main Gudwal Rd, Wah Cantt  
Do not mix layouts from The Mall / Officers Colony / Quaid Avenue branches.

## Success criteria

1. A student given no instructions can locate and enter five named campus locations within **10 minutes** of first load.
2. The scavenger hunt is completable in **≤15 minutes**, and **≥70%** of playtesters finish without asking for help.
3. **20 concurrent** avatars in one world with no visible rubber-banding on campus wifi.
4. Cold load to playable in **&lt;8 seconds** on a mid-range laptop; works in current Chrome, Edge, and Safari on desktop.
5. Orientation staff can change any building description, NPC line, or quest step by editing **one content file**, with no game-code changes.

## Keep / Adapt / Drop from SkyOffice

| Capability | Decision | Why |
| --- | --- | --- |
| WASD + tilemap collision | Keep | Core loop |
| Colyseus presence, nameplates | Keep | Hard-won netcode |
| Text chat + in-world bubbles | Keep | Social presence |
| Character select + name | Keep | Zero-friction identity |
| Phaser↔React bridge, E-interact | Keep | Reused for buildings/NPCs |
| E to sit | Keep (benches) | Free delight |
| R / computer / screen share | Adapt → notice-board kiosks | Drop WebRTC |
| Multi rooms | Adapt → zones on one map | No room switching |
| Proximity algorithm | Adapt → building/NPC triggers | Same math, new payload |
| PeerJS video | Drop | Consent / moderation for minors |
| Screen sharing | Drop | Complexity, no orientation value |
| Whiteboards | Drop | No use case |
| Custom/private rooms | Drop | One public campus is the product |

## Non-goals (v1)

- Video chat, proximity voice, screen share
- Embedded whiteboards
- User accounts or any database
- Custom / private / password rooms
- Mobile or touch controls
- In-app map editor
- Leaderboards
- i18n
- Analytics beyond an optional anonymous “hunt completed” counter

## Brand

Dark navy UI chrome stays (pixel art reads well on it). LGS identity comes from the map, logo, building photos, and copy — not a full UI recolour. One `--lgs-brand` token for logo, primary CTA, and quest-complete accents.
