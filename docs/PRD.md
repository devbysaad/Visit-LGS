# PRD — CampusQuest v1

User stories with acceptance criteria. Each story is tagged with a delivery phase.

## Onboarding — Phase 1 / 6

### US-01 Name and avatar
**As a** new student, **I want to** choose a display name and avatar before entering campus, **so that** others can recognise me.

**Acceptance**
- Given the join screen is visible, when I enter a name (2–16 chars) and pick an avatar, then I can join the campus room.
- Given an empty or invalid name, when I submit, then I see a clear validation error and do not join.
- Given I am on a phone-sized viewport, when the app loads, then I see the desktop-only gate (US-09) instead of join.

### US-02 Spawn at gate
**As a** player who just joined, **I want to** spawn at the main gate, **so that** orientation starts from a known landmark.

**Acceptance**
- Given I join successfully, when CampusScene starts, then my avatar appears at the map object named `spawn_gate`.

## Movement and collision — Phase 1 / 2

### US-03 Walk the campus
**As a** player, **I want to** move with WASD or arrow keys, **so that** I can explore.

**Acceptance**
- Given focus is on the game (no modal/chat), when I hold a movement key, then my avatar moves and plays the matching walk animation.
- Given I release keys, when idle, then the idle animation faces the last direction.

### US-04 Collision
**As a** player, **I want** walls and furniture to block me, **so that** the campus feels solid.

**Acceptance**
- Given I walk into a collision tile or collider object, when movement is applied, then I stop at the boundary (no tunneling through walls).

## Building interaction — Phase 3

### US-05 Building prompt and modal
**As a** player near a building, **I want** a Press E prompt and an info modal, **so that** I learn what the place is for.

**Acceptance**
- Given I overlap a building zone, when the zone is selected, then an in-world prompt shows `Press E to enter {DisplayName}`.
- Given the prompt is visible, when I press E, then a React modal opens with photo, name, tagline, description, and “who to ask”.
- Given the modal is open, when movement keys are pressed, then the avatar does not move.
- Given the modal is open, when I press Esc or close, then the modal closes and movement resumes.
- Given `buildingId` on the zone, when the modal opens, then content comes from `content/buildings.ts` for that id.

### US-06 Notice-board kiosk
**As a** player, **I want to** press E at a notice board, **so that** I can read timetable/FAQ text and pin a short note others can read.

**Acceptance**
- Given I interact with the notice-board building, when E is pressed, then a modal shows staff pins from content plus shared student posts (not WebRTC or freehand whiteboard).
- Given I submit a short note, when another player opens the board (or joins later), then they can read that note.

### US-06b Library reading
**As a** player, **I want to** press E at the library and open a book, **so that** I can flip through orientation pages.

**Acceptance**
- Given the library modal is open, when I choose a book, then an open-book view shows page text with next/back controls.
- Given I am on a page, when I press ←/→ or the nav buttons, then the page changes within the book.
### US-07 Sit on benches
**As a** player, **I want to** press E near a bench to sit, **so that** I can rest in place like in SkyOffice.

**Acceptance**
- Given I am near a bench zone, when I press E, then my avatar sits and stops walking until I press E again or move.

## NPC dialogue — Phase 5

### US-08 Talk to NPCs
**As a** player, **I want to** talk to orientation NPCs, **so that** I get tips without a human guide.

**Acceptance**
- Given I overlap an NPC zone, when I press E, then a bottom dialogue panel shows the NPC name, portrait, and first line.
- Given dialogue is open, when I press E or Space, then the next line advances until the last line closes the panel.
- Given dialogue is open, when it is active, then movement is locked.

## Scavenger hunt — Phase 5

### US-09 Quest tracker
**As a** player, **I want** a current objective always visible, **so that** I never feel lost.

**Acceptance**
- Given the hunt has started, when I am in CampusScene, then the HUD shows the current step in one line (top-left).
- Given I press J, when the quest log opens, then I see completed and remaining steps.

### US-10 Complete hunt steps
**As a** player, **I want** visiting the correct building (or talking to the hooked NPC) to advance the hunt, **so that** exploration has a spine.

**Acceptance**
- Given my current step targets `buildingId` X, when I successfully open that building’s modal (or complete the NPC hook), then the step completes, a toast fires, and the next step becomes current.
- Given I refresh the browser mid-hunt, when I rejoin with the same browser profile, then progress restores from `localStorage` keyed by content version.
- Given all steps are done, when the last step completes, then a completion screen appears with reward copy from `quests.ts`.

## Multiplayer presence — Phase 1 / 4

### US-11 See other players
**As a** player, **I want to** see other students move in real time, **so that** orientation feels populated.

**Acceptance**
- Given two clients in the `campus` room, when either moves, then the other sees the avatar update with nameplate (lerp, no hard snap at normal rates).
- Given a client disconnects, when they leave, then their sprite is removed on remaining clients.

### US-12 Text chat
**As a** player, **I want** text chat with in-world bubbles, **so that** I can ask quick questions.

**Acceptance**
- Given I press Enter, when chat opens, then Phaser keyboard movement is disabled while the input is focused.
- Given I send a message, when it is accepted, then it appears in the chat panel and as a bubble above my avatar (~6s).
- Given a name or message fails the length/profanity filter, when I submit, then it is rejected with feedback.

## Help and completion — Phase 6

### US-13 Help modal
**As a** player, **I want** a controls help screen (?), **so that** I can recover without asking staff.

### US-14 Desktop-only gate
**As a** mobile visitor, **I want** a clear message that desktop is required, **so that** I do not get a broken touch experience.

### US-15 Loading progress
**As a** player, **I want** a loading screen with real progress, **so that** I know assets are loading.
