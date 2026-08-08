import Phaser from 'phaser'
import PlayerSelector from './PlayerSelector'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import { sittingShiftData } from './Player'
import Player from './Player'
import Network from '../services/Network'
import Chair from '../items/Chair'
import BuildingZone from '../zones/BuildingZone'
import NpcZone from '../zones/NpcZone'
import RoomZone from '../zones/RoomZone'
import BoardZone from '../zones/BoardZone'
import PortalZone from '../zones/PortalZone'

import { phaserEvents, Event } from '../events/EventCenter'
import store from '../stores'
import { pushPlayerJoinedMessage } from '../stores/ChatStore'
import { ItemType } from '../../../types/Items'
import { NavKeys } from '../../../types/KeyboardState'
import EggZone from '../zones/EggZone'
import Car, { CarDirection } from '../items/Car'

const WALK_SPEED = 200
const DRIVE_SPEED = 430

export default class MyPlayer extends Player {
  private playContainerBody: Phaser.Physics.Arcade.Body
  private chairOnSit?: Chair
  private carDriven?: Car
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
  }

  setPlayerName(name: string) {
    this.playerName.setText(name)
    phaserEvents.emit(Event.MY_PLAYER_NAME_CHANGE, name)
    store.dispatch(pushPlayerJoinedMessage(name))
  }

  setPlayerTexture(texture: string) {
    this.playerTexture = texture
    this.anims.play(`${this.playerTexture}_idle_down`, true)
    phaserEvents.emit(Event.MY_PLAYER_TEXTURE_CHANGE, this.x, this.y, this.anims.currentAnim.key)
  }

  get isDriving() {
    return this.playerBehavior === PlayerBehavior.DRIVING
  }

  private boardCar(car: Car, playerSelector: PlayerSelector, network: Network) {
    this.carDriven = car
    this.playerBehavior = PlayerBehavior.DRIVING
    car.clearDialogBox()
    car.driverId = this.playerId
    this.setVisible(false)
    this.playerContainer.setVisible(false)
    playerSelector.selectedItem = undefined
    playerSelector.setPosition(0, 0)
    this.setVelocity(0, 0)
    car.driveTo(this.x, this.y)
    phaserEvents.emit(Event.DRIVING_CHANGED, true)
    network.updatePlayerRiding(true)
  }

  private leaveCar(playerSelector: PlayerSelector, cursors: NavKeys, network: Network) {
    const car = this.carDriven
    this.playerBehavior = PlayerBehavior.IDLE
    this.setVisible(true)
    this.playerContainer.setVisible(true)
    this.setVelocity(0, 0)
    this.playContainerBody.setVelocity(0, 0)
    if (car) {
      car.driverId = undefined
      car.park(this.x, this.y + 4)
      // Step out beside the car so E does not instantly re-board it
      this.setPosition(this.x - 48, this.y)
      this.playerContainer.setPosition(this.x, this.y - 30)
    }
    this.carDriven = undefined
    playerSelector.setPosition(this.x, this.y)
    playerSelector.update(this, cursors)
    phaserEvents.emit(Event.DRIVING_CHANGED, false)
    network.updatePlayerRiding(false)
    network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
  }

  update(
    playerSelector: PlayerSelector,
    cursors: NavKeys,
    keyE: Phaser.Input.Keyboard.Key,
    network: Network
  ) {
    if (!cursors) return

    const item = playerSelector.selectedItem

    switch (this.playerBehavior) {
      case PlayerBehavior.IDLE:
        // Portals first — enter/exit buildings before doorway info cards
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.PORTAL) {
          ;(item as PortalZone).onInteract()
          return
        }
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.EGG) {
          ;(item as EggZone).onInteract()
          return
        }
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.CAR) {
          this.boardCar(item as Car, playerSelector, network)
          return
        }
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.BUILDING) {
          ;(item as BuildingZone).onInteract()
          return
        }
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.ROOM) {
          ;(item as RoomZone).onInteract()
          return
        }
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.BOARD) {
          ;(item as BoardZone).onInteract()
          return
        }
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.NPC) {
          ;(item as NpcZone).onInteract()
          return
        }

        // if press E in front of selected chair
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.CHAIR) {
          const chairItem = item as Chair
          /**
           * move player to the chair and play sit animation
           * a delay is called to wait for player movement (from previous velocity) to end
           * as the player tends to move one more frame before sitting down causing player
           * not sitting at the center of the chair
           */
          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              // update character velocity and position
              this.setVelocity(0, 0)
              if (chairItem.itemDirection) {
                this.setPosition(
                  chairItem.x + sittingShiftData[chairItem.itemDirection][0],
                  chairItem.y + sittingShiftData[chairItem.itemDirection][1]
                ).setDepth(chairItem.depth + sittingShiftData[chairItem.itemDirection][2])
                // also update playerNameContainer velocity and position
                this.playContainerBody.setVelocity(0, 0)
                this.playerContainer.setPosition(
                  chairItem.x + sittingShiftData[chairItem.itemDirection][0],
                  chairItem.y + sittingShiftData[chairItem.itemDirection][1] - 30
                )
              }

              this.play(`${this.playerTexture}_sit_${chairItem.itemDirection}`, true)
              playerSelector.selectedItem = undefined
              if (chairItem.itemDirection === 'up') {
                playerSelector.setPosition(this.x, this.y - this.height)
              } else {
                playerSelector.setPosition(0, 0)
              }
              // send new location and anim to server
              network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
            },
            loop: false,
          })
          // set up new dialog as player sits down
          chairItem.clearDialogBox()
          chairItem.setDialogBox('Press E to leave')
          this.chairOnSit = chairItem
          this.playerBehavior = PlayerBehavior.SITTING
          return
        }

        const speed = WALK_SPEED
        let vx = 0
        let vy = 0

        if (cursors.left?.isDown || cursors.A?.isDown) vx -= speed
        if (cursors.right?.isDown || cursors.D?.isDown) vx += speed
        if (cursors.up?.isDown || cursors.W?.isDown) {
          vy -= speed
          this.setDepth(this.y) //change player.depth if player.y changes
        }
        if (cursors.down?.isDown || cursors.S?.isDown) {
          vy += speed
          this.setDepth(this.y) //change player.depth if player.y changes
        }
        // update character velocity
        this.setVelocity(vx, vy)
        this.body.velocity.setLength(speed)
        // also update playerNameContainer velocity
        this.playContainerBody.setVelocity(vx, vy)
        this.playContainerBody.velocity.setLength(speed)

        // update animation according to velocity and send new location and anim to server
        if (vx !== 0 || vy !== 0) network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        if (vx > 0) {
          this.play(`${this.playerTexture}_run_right`, true)
        } else if (vx < 0) {
          this.play(`${this.playerTexture}_run_left`, true)
        } else if (vy > 0) {
          this.play(`${this.playerTexture}_run_down`, true)
        } else if (vy < 0) {
          this.play(`${this.playerTexture}_run_up`, true)
        } else {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          const newAnim = parts.join('_')
          // this prevents idle animation keeps getting called
          if (this.anims.currentAnim.key !== newAnim) {
            this.play(parts.join('_'), true)
            // send new location and anim to server
            network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
          }
        }
        break

      case PlayerBehavior.SITTING:
        // back to idle if player press E while sitting
        if (Phaser.Input.Keyboard.JustDown(keyE)) {
          const parts = this.anims.currentAnim.key.split('_')
          parts[1] = 'idle'
          this.play(parts.join('_'), true)
          this.playerBehavior = PlayerBehavior.IDLE
          this.chairOnSit?.clearDialogBox()
          playerSelector.setPosition(this.x, this.y)
          playerSelector.update(this, cursors)
          network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        }
        break

      case PlayerBehavior.DRIVING: {
        if (Phaser.Input.Keyboard.JustDown(keyE)) {
          this.leaveCar(playerSelector, cursors, network)
          return
        }

        let dx = 0
        let dy = 0
        if (cursors.left?.isDown || cursors.A?.isDown) dx -= DRIVE_SPEED
        if (cursors.right?.isDown || cursors.D?.isDown) dx += DRIVE_SPEED
        if (cursors.up?.isDown || cursors.W?.isDown) dy -= DRIVE_SPEED
        if (cursors.down?.isDown || cursors.S?.isDown) dy += DRIVE_SPEED

        this.setVelocity(dx, dy)
        if (dx !== 0 || dy !== 0) this.body.velocity.setLength(DRIVE_SPEED)
        this.playContainerBody.setVelocity(dx, dy)

        let facing: CarDirection | undefined
        if (Math.abs(dx) > Math.abs(dy)) facing = dx > 0 ? 'right' : 'left'
        else if (dy !== 0) facing = dy > 0 ? 'down' : 'up'
        if (facing) this.carDriven?.setFacing(facing)

        this.carDriven?.driveTo(this.x, this.y)
        this.setDepth(this.y)
        if (dx !== 0 || dy !== 0) network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
        break
      }
    }
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      myPlayer(x: number, y: number, texture: string, id: string, frame?: string | number): MyPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'myPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new MyPlayer(this.scene, x, y, texture, id, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    const collisionScale = [0.5, 0.2]
    sprite.body
      .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
      .setOffset(
        sprite.width * (1 - collisionScale[0]) * 0.5,
        sprite.height * (1 - collisionScale[1])
      )

    return sprite
  }
)
