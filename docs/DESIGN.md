# Design — CampusQuest

Visual and interaction design. Inspiration screenshots live in `desingInspo/` (SkyOffice pitch deck).

## Two visual registers (never mix)

| Register | Where | Examples |
| --- | --- | --- |
| In-world | Phaser, world space | Nameplates, dialog bubbles, `Press E` prompts |
| Overlay | React DOM above canvas | Chat, modals, HUD, join screen |

In-world UI scales/occludes with the camera. Overlay UI does not.

## Colour tokens (CSS custom properties)

Code source of truth: `client/src/theme.ts` — **deep teal + coral + butter**, Fraunces/Manrope. Not SkyOffice slate/mint, not NUST navy/gold.

```css
--bg-deep: #0b1f24;
--bg-panel: #123338;
--bg-panel-alt: #1a4a50;
--bg-scrim: rgba(4, 16, 22, 0.88);
--accent: #fb7185;       /* coral */
--accent-hot: #fda4af;
--border-glow: #fde68a;  /* butter */
--text-primary: #e0f2f1;
--text-muted: #94b0b4;
```

Chat usernames: fixed palette of six high-contrast hues assigned by name hash.

## Typography

- **Display:** Fraunces (brand, modal titles, chat header).
- **Body:** Manrope 14–16px, line-height 1.5.
- **Pixel/bitmap:** in-world only; strings of five words or fewer (nameplates, prompts).

## Pixel fidelity

- Phaser: `pixelArt: true`, `roundPixels: true`
- DOM pixel images: `image-rendering: pixelated`
- Camera zoom: **1.5** (fallback 2.0 if edge shimmer)
- No CSS blur/drop-shadow over the canvas region
- Integral sprite positions/sizes

## Z-index layers

| Layer | z-index |
| --- | --- |
| Canvas | 0 |
| HUD / objective tracker | 100 |
| Chat panel | 200 |
| Interaction prompt overlay (if DOM) | 300 |
| Modal scrim | 400 |
| Modal | 410 |
| Toasts | 500 |
| Join / character select | 600 |
| Desktop-only gate | 700 |

## Interaction patterns

- **Proximity:** overlap sets one “selected interactable”; show in-world white hard-outline prompt under the player (`Press E to enter the Library`). Leaving clears. Only one selection at a time.
- **E** = universal interact (door portals, building info, interior rooms, boards, NPCs, benches). **R is retired.**
- When several interactables overlap, priority is: chair → board → portal → NPC → room → building (so room info does not steal sit/board).
- **Enter buildings via portals:** Press E at a labelled door → full fade → teleport onto that building’s interior island. Camera bounds clip to that area so the outdoor campus is gone until you exit. Room labels and furniture live inside.
- **Chairs:** Press E to sit / leave. Classroom rows face the board.
- **Notice board:** fullscreen corkboard (Among Us–style task panel) — staff pins, campus buzz, and live student posts. Press E at the outdoor Notice Board or any classroom whiteboard. Esc closes.
- **Boards:** classroom whiteboards open the same shared campus notice board (not separate chalk UIs).
- **Ambient life:** Local student/staff walkers patrol interiors (not networked). Real multiplayer peers only appear in your current area.
- **Teacher:** Mr. Imran near the classrooms door explains the block.
- **Enter** = open/send chat; **Esc** = close topmost layer; **J** = quest log; **?** = help.
- **NPC dialogue:** line-by-line on E/Space; portrait left, name above; bottom-centre panel; movement locked.
- **Building modal:** centred over scrim — photo, name, tagline, 2–3 sentences, “who to ask”, close. Quest completion fires a toast without blocking the modal.
- **Library:** shelf list → open book with **Back page** / **Next page** (also ←/→). Esc returns to shelf, then closes.
- **Objective tracker:** top-left, one line current step.
- **Chat:** bottom-left dark panel (`Press Enter to chat`), coloured names, grey system join/leave, in-world bubbles ~6s (see `Screenshot 2026-08-03 at 2.51.20 PM.png`).

## Component specs (reference screenshots)

| Component | Inspo file | Notes |
| --- | --- | --- |
| Proximity / Press E | `…2.50.39 PM.png`, `…2.51.04 PM.png` | Adapt video off; keep prompt style |
| Zone typology | `…2.50.51 PM.png` | Map to campus zones, not office room types |
| Screen share UI | `…2.51.04 PM.png` | **Do not ship** — pattern only for future kiosk layout ideas |
| Chat + bubbles | `…2.51.20 PM.png` | Keep dual-view sync |
| Whiteboard | `…2.51.36 PM.png` | **Do not ship** |
| Custom rooms | `…2.51.50 PM.png` | **Do not ship** — mint button/panel chrome is the token source |

## Join screen

Name field + avatar grid + mint primary CTA. Background scene shows static pixel campus sky so launch is never a blank canvas. LGS logo uses `--lgs-brand`.
