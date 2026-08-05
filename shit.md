That's a cool project idea! Building a 2D virtual campus explorer for LGS College is very doable, especially since it's smaller than NUST. SkyOffice is actually a great reference — it uses exactly the right stack for this kind of thing.

Let me break down how you'd build this:

The Core Stack (same as SkyOffice)

Phaser 3 is the heart of it — it handles the 2D game world, character movement, collision detection, and tile maps. This is what renders your campus map and moves players around.

Colyseus handles multiplayer — it's a WebSocket server that keeps all players in sync. When someone moves, everyone else sees it in real time.

React sits on top of Phaser and handles the UI layer — chat boxes, menus, popups about campus buildings, etc.

PeerJS (optional for your use case) handles video chat. You might not need this for a university orientation game.

How to Build It — Step by Step
Step 1: Design Your Campus Map (Tiled Map Editor)

This is where you spend most of your early time. You use Tiled (free software) to draw your campus:

Download Tiled Map Editor (mapeditor.org)
Get a tileset — pixel art tiles for buildings, grass, paths, etc. LimeZu on itch.io has free ones (same ones SkyOffice used)
Draw your LGS campus layout — buildings, pathways, gardens, gates
Export as .json — Phaser reads this directly

The map is just a grid of tiles. You define layers: ground layer, walls layer, objects layer, etc.

Step 2: Set Up Phaser 3 with the Map
typescript
// Load your Tiled map
this.load.tilemapTiledJSON('campus', 'assets/maps/lgs-campus.json')
this.load.image('tiles', 'assets/tilesets/interior.png')

// Create the map in your scene
const map = this.make.tilemap({ key: 'campus' })
const tileset = map.addTilesetImage('interior', 'tiles')

// Layers
const groundLayer = map.createLayer('Ground', tileset)
const wallLayer = map.createLayer('Walls', tileset)
wallLayer.setCollisionByProperty({ collides: true }) // walls block movement
Step 3: Add Your Player Character
typescript
// Sprite with physics
this.player = this.physics.add.sprite(200, 200, 'player')
this.physics.add.collider(this.player, wallLayer)

// Movement in update()
const cursors = this.input.keyboard.createCursorKeys()
if (cursors.left.isDown) {
  this.player.setVelocityX(-160)
  this.player.anims.play('walk-left', true)
} else if (cursors.right.isDown) {
  // etc.
}
Step 4: Add Multiplayer with Colyseus

Colyseus has a server (Node.js) and a client SDK. The server keeps track of all player positions:

typescript
// Server-side Room
class CampusRoom extends Room {
  onCreate() {
    this.setState(new CampusState())
    
    this.onMessage('move', (client, data) => {
      const player = this.state.players.get(client.sessionId)
      player.x = data.x
      player.y = data.y
    })
  }
  
  onJoin(client) {
    const player = new Player()
    this.state.players.set(client.sessionId, player)
  }
}
typescript
// Client-side — connect and sync
const client = new Client('ws://localhost:2567')
const room = await client.joinOrCreate('campus')

room.state.players.onAdd((player, sessionId) => {
  // Create a sprite for this player
  const otherPlayer = this.add.sprite(player.x, player.y, 'player')
  player.onChange(() => {
    otherPlayer.x = player.x
    otherPlayer.y = player.y
  })
})
Step 5: Add Campus-Specific Features

This is where you make it feel like LGS — not just a generic game:

Building info popups — walk near the main hall → a React modal pops up with info, photos, history
Interactive zones — cafeteria, library, classrooms each do something
NPC characters — stationary characters that give orientation tips
Mini-quests — "find the admin office" type scavenger hunt for new students
Recommended Project Structure
lgs-campus/
├── client/
│   ├── src/
│   │   ├── scenes/        ← Phaser scenes (MainScene, BootScene)
│   │   ├── components/    ← React UI components
│   │   ├── stores/        ← Redux state
│   │   └── characters/    ← Player, NPC logic
│   └── assets/
│       ├── maps/          ← Your Tiled .json files
│       ├── tilesets/      ← Tile images
│       └── characters/    ← Sprite sheets
└── server/
    ├── rooms/             ← Colyseus rooms
    └── index.ts           ← Entry point
Realistic Timeline
Phase	What	Time
1	Learn Phaser basics, set up project	1 week
2	Draw LGS campus map in Tiled	1–2 weeks
3	Player movement + collision working	3–4 days
4	Colyseus multiplayer	1 week
5	UI, popups, campus info	1 week
6	Polish, deploy	3–4 days
Quickest Way to Start

Clone SkyOffice and just replace their map with your LGS campus map first. Get it running locally, understand how the pieces connect, then customize. That's honestly the fastest path — don't start from scratch.

bash
git clone https://github.com/kevinshen56714/SkyOffice.git lgs-campus
cd lgs-campus
yarn && yarn start

Then open Tiled, draw your campus, swap the map file, and you already have multiplayer working.

Want me to help with any specific part — like drawing the Tiled map structure, the Phaser scene setup, or the Colyseus room logic?