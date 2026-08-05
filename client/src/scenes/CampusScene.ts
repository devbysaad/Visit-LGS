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
import AmbientCharacter from '../characters/AmbientCharacter'
import PlayerSelector from '../characters/PlayerSelector'
import BuildingZone from '../zones/BuildingZone'
import NpcZone from '../zones/NpcZone'
import RoomZone from '../zones/RoomZone'
import BoardZone from '../zones/BoardZone'
import PortalZone, { PortalTarget } from '../zones/PortalZone'
import Network from '../services/Network'
import { IPlayer } from '../../../types/ICampusState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { ItemType } from '../../../types/Items'

import store from '../stores'
import { setFocused, setShowChat } from '../stores/ChatStore'
import { NavKeys, Keyboard } from '../../../types/KeyboardState'
import {
  runMapContentValidation,
  getStringProperty,
  getNumberProperty,
} from '../utils/validateMapContent'
import { phaserEvents, Event } from '../events/EventCenter'
import { getBuildingById } from '../content/buildings'
import { getNpcById } from '../content/npcs'
import { getRoomById } from '../content/rooms'
import { getBoardById } from '../content/boards'
import { DEFAULT_AREA_ID } from '../content/areas'

const DEFAULT_SPAWN = { x: 705, y: 500 }
const TILE = 32
const NPC_TEXTURES = ['ash', 'lucy', 'nancy', 'adam']

/** Lower rank wins when several interactables overlap (rooms are huge and must lose). */
function interactionPriority(itemType: ItemType): number {
  switch (itemType) {
    case ItemType.CHAIR:
      return 0
    case ItemType.BOARD:
      return 1
    case ItemType.PORTAL:
      return 2
    case ItemType.NPC:
      return 3
    case ItemType.VENDINGMACHINE:
      return 4
    case ItemType.ROOM:
      return 5
    case ItemType.BUILDING:
      return 6
    default:
      return 99
  }
}

type AreaBounds = { id: string; x: number; y: number; width: number; height: number }

export default class CampusScene extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: Phaser.GameObjects.Zone
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()
  private ambientCharacters: AmbientCharacter[] = []
  private areaBounds = new Map<string, AreaBounds>()
  private currentAreaId = DEFAULT_AREA_ID
  private transitioning = false

  constructor() {
    super('game')
  }

  registerKeys() {
    this.cursors = {
      ...this.input.keyboard.createCursorKeys(),
      ...(this.input.keyboard.addKeys('W,S,A,D') as Keyboard),
    }

    this.keyE = this.input.keyboard.addKey('E')
    this.input.keyboard.disableGlobalCapture()
    this.input.keyboard.on('keydown-ENTER', () => {
      store.dispatch(setShowChat(true))
      store.dispatch(setFocused(true))
    })
    this.input.keyboard.on('keydown-ESC', () => {
      store.dispatch(setShowChat(false))
    })
    this.input.keyboard.on('keydown-J', () => {
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

    const groundLayer = this.map.createLayer('Ground', [FloorAndGround, Terrain].filter(Boolean))
    groundLayer.setCollisionByProperty({ collides: true })

    runMapContentValidation(this.map)

    this.parseAreaBounds()

    const spawnPoint = this.getSpawnPoint('spawn_gate')
    this.myPlayer = this.add.myPlayer(spawnPoint.x, spawnPoint.y, 'adam', this.network.mySessionId)
    this.playerSelector = new PlayerSelector(this, 0, 0, 28, 28)

    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    chairLayer?.objects.forEach((chairObj) => {
      const item = this.addObjectFromTiled(chairs, chairObj, 'chairs', 'chair') as Chair
      const direction =
        getStringProperty(chairObj, 'direction') ??
        (typeof chairObj.properties?.[0]?.value === 'string'
          ? chairObj.properties[0].value
          : undefined)
      if (direction) item.itemDirection = direction
      const body = item.body as Phaser.Physics.Arcade.StaticBody
      if (body) {
        body.setSize(item.width + 16, item.height + 12)
        body.position.set(
          item.x - body.width * 0.5,
          item.y - body.height * 0.5
        )
      }
    })

    const vendingMachines = this.physics.add.staticGroup({ classType: VendingMachine })
    const vendingMachineLayer = this.map.getObjectLayer('VendingMachine')
    vendingMachineLayer?.objects.forEach((obj) => {
      this.addObjectFromTiled(vendingMachines, obj, 'vendingmachines', 'vendingmachine')
    })

    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
    this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
    this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    this.addGroupFromTiled('Basement', 'basement', 'Basement', true)

    const buildingZones = this.createBuildingZones()
    this.addBuildingLabels(buildingZones)

    const roomZones = this.createRoomZones()
    this.addRoomLabels(roomZones)

    const boardZones = this.createBoardZones()
    const portalZones = this.createPortalZones()
    const npcZones = this.createNpcZones()
    this.createAmbientCharacters()

    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)
    this.applyAreaBounds(this.currentAreaId)
    this.refreshPresenceVisibility()

    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], vendingMachines)

    this.physics.add.overlap(
      this.playerSelector,
      [chairs, vendingMachines],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    const interactables = [
      ...portalZones,
      ...buildingZones,
      ...roomZones,
      ...boardZones,
      ...npcZones,
    ]
    if (interactables.length > 0) {
      this.physics.add.overlap(
        this.playerSelector,
        interactables,
        this.handleItemSelectorOverlap,
        undefined,
        this
      )
    }

    phaserEvents.on(Event.PORTAL_ENTER, this.handlePortalEnter, this)

    this.network.onPlayerJoined(this.handlePlayerJoined, this)
    this.network.onPlayerLeft(this.handlePlayerLeft, this)
    this.network.onMyPlayerReady(this.handleMyPlayerReady, this)
    this.network.onPlayerUpdated(this.handlePlayerUpdated, this)
    this.network.onChatMessageAdded(this.handleChatMessageAdded, this)
  }

  private parseAreaBounds() {
    const areasLayer = this.map.getObjectLayer('areas')
    if (!areasLayer) {
      this.areaBounds.set(DEFAULT_AREA_ID, {
        id: DEFAULT_AREA_ID,
        x: 0,
        y: 0,
        width: this.map.widthInPixels,
        height: this.map.heightInPixels,
      })
      return
    }

    areasLayer.objects.forEach((object) => {
      const areaId = getStringProperty(object, 'areaId')
      if (!areaId) return
      this.areaBounds.set(areaId, {
        id: areaId,
        x: object.x ?? 0,
        y: object.y ?? 0,
        width: object.width ?? this.map.widthInPixels,
        height: object.height ?? this.map.heightInPixels,
      })
    })
  }

  private applyAreaBounds(areaId: string) {
    const bounds =
      this.areaBounds.get(areaId) ??
      this.areaBounds.get(DEFAULT_AREA_ID) ?? {
        id: DEFAULT_AREA_ID,
        x: 0,
        y: 0,
        width: this.map.widthInPixels,
        height: this.map.heightInPixels,
      }
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height)
    this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height)
    this.myPlayer?.setCollideWorldBounds(true)
  }

  private createPortalZones(): PortalZone[] {
    const portalsLayer = this.map.getObjectLayer('portals')
    if (!portalsLayer) return []

    return portalsLayer.objects.reduce<PortalZone[]>((zones, object) => {
      const portalId = getStringProperty(object, 'portalId')
      const targetArea = getStringProperty(object, 'targetArea')
      const spawnTileX = getNumberProperty(object, 'spawnTileX')
      const spawnTileY = getNumberProperty(object, 'spawnTileY')
      const label = getStringProperty(object, 'label') ?? 'Enter'
      if (!portalId || !targetArea || spawnTileX === undefined || spawnTileY === undefined) {
        return zones
      }

      const width = object.width ?? 48
      const height = object.height ?? 48
      const centerX = (object.x ?? 0) + width * 0.5
      const centerY = (object.y ?? 0) + height * 0.5
      const portal: PortalTarget = {
        portalId,
        targetArea,
        spawnX: spawnTileX * TILE + TILE * 0.5,
        spawnY: spawnTileY * TILE + TILE * 0.5,
        label,
      }
      const zone = new PortalZone(this, centerX, centerY, width, height, portal)
      // Prefer portals over co-located building info zones
      zone.setDepth(centerY + 5000)
      this.physics.add.existing(zone, true)
      zones.push(zone)
      return zones
    }, [])
  }

  private handlePortalEnter(portal: PortalTarget) {
    if (this.transitioning || !this.myPlayer) return
    this.transitioning = true
    this.disableKeys()
    this.myPlayer.setVelocity(0, 0)

    const cam = this.cameras.main
    cam.fadeOut(280, 8, 12, 22)
    cam.once('camerafadeoutcomplete', () => {
      this.myPlayer.setPosition(portal.spawnX, portal.spawnY)
      this.myPlayer.playerContainer.setPosition(portal.spawnX, portal.spawnY - 30)
      this.playerSelector.setPosition(portal.spawnX, portal.spawnY)
      this.myPlayer.setDepth(portal.spawnY)

      this.currentAreaId = portal.targetArea
      this.myPlayer.areaId = portal.targetArea
      this.applyAreaBounds(portal.targetArea)
      this.cameras.main.centerOn(portal.spawnX, portal.spawnY)
      this.refreshPresenceVisibility()
      this.network.updatePlayerArea(portal.targetArea)
      this.network.updatePlayer(portal.spawnX, portal.spawnY, this.myPlayer.anims.currentAnim.key)

      cam.fadeIn(320, 8, 12, 22)
      cam.once('camerafadeincomplete', () => {
        this.enableKeys()
        this.transitioning = false
      })
    })
  }

  private refreshPresenceVisibility() {
    this.otherPlayerMap.forEach((player) => player.setAreaVisible(this.currentAreaId))
    this.ambientCharacters.forEach((npc) => npc.setAreaVisible(this.currentAreaId))
  }

  private createAmbientCharacters() {
    const ambientLayer = this.map.getObjectLayer('ambient')
    if (!ambientLayer) return

    ambientLayer.objects.forEach((object, index) => {
      const areaId = getStringProperty(object, 'areaId')
      if (!areaId) return
      const x = object.x ?? 0
      const y = object.y ?? 0
      const walker = new AmbientCharacter(this, x, y, areaId, index)
      this.ambientCharacters.push(walker)
    })
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

  private addBuildingLabels(zones: BuildingZone[]) {
    zones.forEach((zone) => {
      this.add
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
    })
  }

  private createRoomZones(): RoomZone[] {
    const roomsLayer = this.map.getObjectLayer('rooms')
    if (!roomsLayer) return []

    return roomsLayer.objects.reduce<RoomZone[]>((zones, object) => {
      const roomId = getStringProperty(object, 'roomId')
      if (!roomId) return zones

      const room = getRoomById(roomId)
      const width = object.width ?? 64
      const height = object.height ?? 64
      const centerX = (object.x ?? 0) + width * 0.5
      const centerY = (object.y ?? 0) + height * 0.5

      const zone = new RoomZone(
        this,
        centerX,
        centerY,
        width,
        height,
        roomId,
        room?.name ?? roomId
      )
      zone.setDepth(centerY)
      this.physics.add.existing(zone, true)
      zones.push(zone)
      return zones
    }, [])
  }

  private addRoomLabels(zones: RoomZone[]) {
    zones.forEach((zone) => {
      this.add
        .text(zone.x, zone.y, zone.displayName, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: '#eef1f6',
          backgroundColor: '#1a1d2bcc',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(zone.y + 900)
    })
  }

  private createBoardZones(): BoardZone[] {
    const boardsLayer = this.map.getObjectLayer('boards')
    if (!boardsLayer) return []

    return boardsLayer.objects.reduce<BoardZone[]>((zones, object) => {
      const boardId = getStringProperty(object, 'boardId')
      if (!boardId) return zones

      const board = getBoardById(boardId)
      const width = Math.max(object.width ?? 64, 96)
      // Extend south so the player can reach the board from in front of desks
      const height = Math.max((object.height ?? 32) + 64, 96)
      const centerX = (object.x ?? 0) + (object.width ?? width) * 0.5
      const centerY = (object.y ?? 0) + height * 0.5

      const zone = new BoardZone(
        this,
        centerX,
        centerY,
        width,
        height,
        boardId,
        board?.name ?? 'Board'
      )
      zone.setDepth(centerY)
      this.physics.add.existing(zone, true)
      zones.push(zone)
      return zones
    }, [])
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
    if (currentItem) {
      if (currentItem === selectionItem) return
      // Prefer furniture/doors over huge room zones (rooms were stealing E from sit/boards)
      const currentRank = interactionPriority(currentItem.itemType)
      const nextRank = interactionPriority(selectionItem.itemType)
      if (currentRank < nextRank) return
      if (currentRank === nextRank && currentItem.depth >= selectionItem.depth) return
      if (this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) currentItem.clearDialogBox()
    }

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

  private handlePlayerJoined(newPlayer: IPlayer, id: string) {
    const otherPlayer = this.add.otherPlayer(newPlayer.x, newPlayer.y, 'adam', id, newPlayer.name)
    otherPlayer.areaId = newPlayer.areaId || DEFAULT_AREA_ID
    otherPlayer.setAreaVisible(this.currentAreaId)
    this.otherPlayers.add(otherPlayer)
    this.otherPlayerMap.set(id, otherPlayer)
  }

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

  private handlePlayerUpdated(field: string, value: number | string, id: string) {
    const otherPlayer = this.otherPlayerMap.get(id)
    otherPlayer?.updateOtherPlayer(field, value)
    if (field === 'areaId') {
      otherPlayer?.setAreaVisible(this.currentAreaId)
    }
  }

  private handleChatMessageAdded(playerId: string, content: string) {
    const otherPlayer = this.otherPlayerMap.get(playerId)
    // Only show bubbles for people in the same area
    if (otherPlayer && otherPlayer.areaId === this.currentAreaId) {
      otherPlayer.updateDialogBubble(content)
    }
  }

  update() {
    if (this.myPlayer && this.network && !this.transitioning) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.network)
    }
  }
}
