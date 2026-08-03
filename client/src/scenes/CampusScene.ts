import Phaser from 'phaser'

// import { debugDraw } from '../utils/debug'
import { createCharacterAnims } from '../anims/CharacterAnims'

import Interactable from '../items/Interactable'
import Chair from '../items/Chair'
import VendingMachine from '../items/VendingMachine'
import '../characters/MyPlayer'
import '../characters/OtherPlayer'
import MyPlayer from '../characters/MyPlayer'
import OtherPlayer from '../characters/OtherPlayer'
import PlayerSelector from '../characters/PlayerSelector'
import BuildingZone from '../zones/BuildingZone'
import NpcZone from '../zones/NpcZone'
import Network from '../services/Network'
import { IPlayer } from '../../../types/ICampusState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { ItemType } from '../../../types/Items'

import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'
import { runMapContentValidation, getStringProperty } from '../utils/validateMapContent'
import { phaserEvents, Event } from '../events/EventCenter'
import { getBuildingById } from '../content/buildings'
import { getNpcById } from '../content/npcs'

const DEFAULT_SPAWN = { x: 705, y: 500 }
const NPC_TEXTURES = ['ash', 'lucy', 'nancy', 'adam']

export default class CampusScene extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()

  constructor() {
    super('game')
  }

  registerKeys() {
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    // maybe we can have a dedicated method for adding keys if more keys are needed in the future
    this.keyE = this.input.keyboard.addKey('E')
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', (event) => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', (event) => {
      store.dispatch(setShowChat(false))
    })
    // quest log toggle; Phaser only emits the event, a store subscriber dispatches Redux
    this.input.keyboard.on('keydown-J', (event) => {
      phaserEvents.emit(Event.QUEST_LOG_TOGGLE)
    })
  }

  disableKeys() {
    this.input.keyboard.enabled = false
  }

  enableKeys() {
    this.input.keyboard.enabled = true
  }

  create(data: { network: Network }) {
    if (!data.network) {
      throw new Error('server instance missing')
    } else {
      this.network = data.network
    }

    createCharacterAnims(this.anims)

    this.map = this.make.tilemap({ key: 'tilemap' })
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')
    const Terrain = this.map.addTilesetImage('Terrain', 'terrain')

    // Dummy LGS campus uses FloorAndGround (paths/roofs/walls) + Terrain (grass/field)
    const groundLayer = this.map.createLayer('Ground', [FloorAndGround, Terrain].filter(Boolean))
    groundLayer.setCollisionByProperty({ collides: true })

    // debugDraw(groundLayer, this)

    // fail loudly (dev) on buildingId/npcId mismatches between the map and content/*.ts
    runMapContentValidation(this.map)

    const spawnPoint = this.getSpawnPoint('spawn_gate')
    this.myPlayer = this.add.myPlayer(spawnPoint.x, spawnPoint.y, 'adam', this.network.mySessionId)
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // import chair objects from Tiled map to Phaser (layer may be empty on campus map)
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer?.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      // custom properties[0] is the object direction specified in Tiled
      const direction = chairObj.properties?.[0]?.value
      if (direction) item.itemDirection = direction
    })

    // import vending machine objects from Tiled map to Phaser
    const vendingMachines = this.physics.add.staticGroup({ classType: VendingMachine })
    const vendingMachineLayer = this.map.getObjectLayer('VendingMachine')
    vendingMachineLayer?.objects.forEach((obj) => {
      this.addObjectFromTiled(vendingMachines, obj, 'vendingmachines', 'vendingmachine')
    })

    // decorative / collide object layers — safe if missing or empty (campus generator)
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('Basement', 'basement', 'Basement', true)

    // import building trigger zones from Tiled map (Phase 3, see docs/MAP_SPEC.md)
    const buildingZones = this.createBuildingZones()
    this.addBuildingLabels(buildingZones)

    // import npc trigger zones from Tiled map (Phase 5)
    const npcZones = this.createNpcZones()

    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], vendingMachines)

    this.physics.add.overlap(
      this.playerSelector,
      [chairs, vendingMachines],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    if (buildingZones.length > 0) {
      this.physics.add.overlap(
        this.playerSelector,
        buildingZones,
        this.handleItemSelectorOverlap,
        undefined,
        this
      )
    }

    if (npcZones.length > 0) {
      this.physics.add.overlap(
        this.playerSelector,
        npcZones,
        this.handleItemSelectorOverlap,
        undefined,
        this
      )
    }

    // register network event listeners
    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
    this.network.onChatMessageAdded(this.handleChatMessageAdded, this)
  }

  private createBuildingZones(): BuildingZone[] {
    const buildingsLayer = this.map.getObjectLayer('buildings')
    if (!buildingsLayer) return []

    return buildingsLayer.objects.reduce<BuildingZone[]>((zones, object) => {
      const buildingId = getStringProperty(object, 'buildingId')
      if (!buildingId) return zones

      const building = getBuildingById(buildingId)
      const width = object.width ?? 64
      const height = object.height ?? 64
      const centerX = (object.x ?? 0) + width * 0.5
      const centerY = (object.y ?? 0) + height * 0.5

      const zone = new BuildingZone(
        this,
        centerX,
        centerY,
        width,
        height,
        buildingId,
        building?.name ?? buildingId
      )
      zone.setDepth(centerY)
      this.physics.add.existing(zone, true)
      zones.push(zone)
      return zones
    }, [])
  }

  /** Floating nameplates above each building doorway so the dummy campus is findable. */
  private addBuildingLabels(zones: BuildingZone[]) {
    zones.forEach((zone) => {
      const label = this.add
          .text(zone.x, zone.y - zone.height * 0.55, zone.displayName, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#eef1f6',
          backgroundColor: '#222639cc',
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(zone.y + 1000)
        .setScrollFactor(1)
      // keep label attached if we ever move zones; for now static is fine
      void label
    })
  }

  private createNpcZones(): NpcZone[] {
    const npcsLayer = this.map.getObjectLayer('npcs')
    if (!npcsLayer) return []

    return npcsLayer.objects.reduce<NpcZone[]>((zones, object) => {
      const npcId = getStringProperty(object, 'npcId')
      if (!npcId) return zones

      const npc = getNpcById(npcId)
      const width = 32
      const height = 32
      const centerX = object.x ?? 0
      const centerY = object.y ?? 0
      const texture = NPC_TEXTURES[zones.length % NPC_TEXTURES.length]

      const zone = new NpcZone(
        this,
        centerX,
        centerY,
        width,
        height,
        npcId,
        npc?.name ?? npcId,
        texture
      )
      zone.setDepth(centerY)
      this.physics.add.existing(zone, true)
      zones.push(zone)
      return zones
    }, [])
  }

  private getSpawnPoint(spawnName: string): { x: number; y: number } {
    const spawnsLayer = this.map.getObjectLayer('spawns')
    const spawnObject = spawnsLayer?.objects.find((object) => object.name === spawnName)
    if (spawnObject && typeof spawnObject.x === 'number' && typeof spawnObject.y === 'number') {
      return { x: spawnObject.x, y: spawnObject.y }
    }
    console.warn(`[CampusScene] Spawn point "${spawnName}" not found, using default spawn.`)
    return DEFAULT_SPAWN
  }

  private handleItemSelectorOverlap(playerSelector, selectionItem) {
    const currentItem = playerSelector.selectedItem as Interactable
    // currentItem is undefined if nothing was perviously selected
    if (currentItem) {
      // if the selection has not changed, do nothing
      if (currentItem === selectionItem || currentItem.depth >= selectionItem.depth) {
        return
      }
      // if selection changes, clear pervious dialog
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) currentItem.clearDialogBox()
    }

    // set selected item and set up new dialog
    playerSelector.selectedItem = selectionItem
    selectionItem.onOverlapDialog()
  }

  private addObjectFromTiled(
    group: Phaser.Physics.Arcade.StaticGroup,
    object: Phaser.Types.Tilemaps.TiledObject,
    key: string,
    tilesetName: string
  ) {
    const actualX = object.x! + object.width! * 0.5
    const actualY = object.y! - object.height! * 0.5
    const obj = group
      .get(actualX, actualY, key, object.gid! - this.map.getTileset(tilesetName).firstgid)
      .setDepth(actualY)
    return obj
  }

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    if (!objectLayer) return
    const tileset = this.map.getTileset(tilesetName)
    if (!tileset) return
    objectLayer.objects.forEach((object) => {
      if (object.gid === undefined) return
      const actualX = object.x! + object.width! * 0.5
      const actualY = object.y! - object.height! * 0.5
      group.get(actualX, actualY, key, object.gid - tileset.firstgid).setDepth(actualY)
    })
    if (this.myPlayer && collidable)
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
  }

  // function to add new player to the otherPlayer group
  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    const otherPlayer = this.add.otherPlayer(newPlayer.x, newPlayer.y, 'adam', id, newPlayer.name)
    this.otherPlayers.add(otherPlayer)
    this.otherPlayerMap.set(id, otherPlayer)
  }

  // function to remove the player who left from the otherPlayer group
  private handlePlayerLeft(id: string) {
    if (this.otherPlayerMap.has(id)) {
      const otherPlayer = this.otherPlayerMap.get(id)
      if (!otherPlayer) return
      this.otherPlayers.remove(otherPlayer, true, true)
      this.otherPlayerMap.delete(id)
    }
  }

  private handleMyPlayerReady() {
    this.myPlayer.readyToConnect = true
  }

  // function to update target position upon receiving player updates
  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    const otherPlayer = this.otherPlayerMap.get(id)
    otherPlayer?.updateOtherPlayer(field, value)
  }

  private handleChatMessageAdded(playerId: string, content: string) {
    const otherPlayer = this.otherPlayerMap.get(playerId)
    otherPlayer?.updateDialogBubble(content)
  }

  update(t: number, dt: number) {
    if (this.myPlayer && this.network) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.network)
    }
  }
}
