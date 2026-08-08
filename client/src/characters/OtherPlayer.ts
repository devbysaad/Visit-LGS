import Phaser from 'phaser'
import Player from './Player'
import { sittingShiftData } from './Player'
import { CAR_KEYS, carKeyForDirection, createCarTextures } from '../items/CarTextures'

export default class OtherPlayer extends Player {
  private targetPosition: [number, number]
  private lastUpdateTimestamp?: number
  private playContainerBody: Phaser.Physics.Arcade.Body
  private riding = false
  private carSprite?: Phaser.GameObjects.Image

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    name: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.targetPosition = [x, y]

    this.playerName.setText(name)
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
  }

  updateOtherPlayer(field: string, value: number | string | boolean) {
    switch (field) {
      case 'name':
        if (typeof value === 'string') {
          this.playerName.setText(value)
        }
        break

      case 'x':
        if (typeof value === 'number') {
          this.targetPosition[0] = value
        }
        break

      case 'y':
        if (typeof value === 'number') {
          this.targetPosition[1] = value
        }
        break

      case 'anim':
        if (typeof value === 'string') {
          this.anims.play(value, true)
        }
        break

      case 'readyToConnect':
        if (typeof value === 'boolean') {
          this.readyToConnect = value
        }
        break

      case 'areaId':
        if (typeof value === 'string') {
          this.areaId = value
        }
        break

      case 'riding':
        if (typeof value === 'boolean') this.setRiding(value)
        break
    }
  }

  private setRiding(riding: boolean) {
    this.riding = riding
    if (riding && !this.carSprite) {
      createCarTextures(this.scene)
      this.carSprite = this.scene.add.image(this.x, this.y - 6, CAR_KEYS.down)
    }
    if (!riding && this.carSprite) {
      this.carSprite.destroy()
      this.carSprite = undefined
    }
    // The driver sits inside the car, so hide the walking sprite
    this.setVisible(!riding && this.areaId === this.currentAreaId)
  }

  private currentAreaId = 'outdoor'

  setAreaVisible(currentAreaId: string) {
    this.currentAreaId = currentAreaId
    const show = this.areaId === currentAreaId
    this.setVisible(show && !this.riding)
    this.playerContainer.setVisible(show)
    this.carSprite?.setVisible(show && this.riding)
    if (!show) {
      this.setVelocity(0, 0)
      this.playContainerBody.setVelocity(0, 0)
    }
  }

  destroy(fromScene?: boolean) {
    this.playerContainer.destroy()
    this.carSprite?.destroy()

    super.destroy(fromScene)
  }

  /** preUpdate is called every frame for every game object. */
  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)

    // if Phaser has not updated the canvas (when the game tab is not active) for more than 1 sec
    // directly snap player to their current locations
    if (this.lastUpdateTimestamp && t - this.lastUpdateTimestamp > 750) {
      this.lastUpdateTimestamp = t
      this.x = this.targetPosition[0]
      this.y = this.targetPosition[1]
      this.playerContainer.x = this.targetPosition[0]
      this.playerContainer.y = this.targetPosition[1] - 30
      return
    }

    this.lastUpdateTimestamp = t
    this.setDepth(this.y) // change player.depth based on player.y
    if (this.carSprite) {
      const dirX = this.targetPosition[0] - this.x
      const dirY = this.targetPosition[1] - this.y
      if (Math.abs(dirX) > 2 || Math.abs(dirY) > 2) {
        const facing =
          Math.abs(dirX) > Math.abs(dirY) ? (dirX > 0 ? 'right' : 'left') : dirY > 0 ? 'down' : 'up'
        this.carSprite.setTexture(carKeyForDirection(facing))
      }
      this.carSprite.setPosition(this.x, this.y - 6).setDepth(this.y + 1)
    }
    const animParts = this.anims.currentAnim.key.split('_')
    const animState = animParts[1]
    if (animState === 'sit') {
      const animDir = animParts[2]
      const sittingShift = sittingShiftData[animDir]
      if (sittingShift) {
        // set hardcoded depth (differs between directions) if player sits down
        this.setDepth(this.depth + sittingShiftData[animDir][2])
      }
    }

    const speed = 200 // speed is in unit of pixels per second
    const delta = (speed / 1000) * dt // minimum distance that a player can move in a frame (dt is in unit of ms)
    let dx = this.targetPosition[0] - this.x
    let dy = this.targetPosition[1] - this.y

    // if the player is close enough to the target position, directly snap the player to that position
    if (Math.abs(dx) < delta) {
      this.x = this.targetPosition[0]
      this.playerContainer.x = this.targetPosition[0]
      dx = 0
    }
    if (Math.abs(dy) < delta) {
      this.y = this.targetPosition[1]
      this.playerContainer.y = this.targetPosition[1] - 30
      dy = 0
    }

    // if the player is still far from target position, impose a constant velocity towards it
    let vx = 0
    let vy = 0
    if (dx > 0) vx += speed
    else if (dx < 0) vx -= speed
    if (dy > 0) vy += speed
    else if (dy < 0) vy -= speed

    // update character velocity
    this.setVelocity(vx, vy)
    this.body.velocity.setLength(speed)
    // also update playerNameContainer velocity
    this.playContainerBody.setVelocity(vx, vy)
    this.playContainerBody.velocity.setLength(speed)
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      otherPlayer(
        x: number,
        y: number,
        texture: string,
        id: string,
        name: string,
        frame?: string | number
      ): OtherPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'otherPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    name: string,
    frame?: string | number
  ) {
    const sprite = new OtherPlayer(this.scene, x, y, texture, id, name, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    const collisionScale = [6, 4]
    sprite.body
      .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
      .setOffset(
        sprite.width * (1 - collisionScale[0]) * 0.5,
        sprite.height * (1 - collisionScale[1]) * 0.5 + 17
      )

    return sprite
  }
)
