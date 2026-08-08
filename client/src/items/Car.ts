import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Interactable from './Interactable'
import { CAR_KEYS, carKeyForDirection, createCarTextures } from './CarTextures'

export type CarDirection = 'up' | 'down' | 'left' | 'right'

/**
 * The campus car. Outdoor only: it is a parked prop until a player presses E,
 * after which MyPlayer drives it (the player's own body stays the collider so
 * the existing world/collider setup keeps working) and the car sprite is glued
 * to the player position.
 */
export default class Car extends Phaser.GameObjects.Container implements Interactable {
  itemType = ItemType.CAR
  vehicleId: string
  areaId: string
  driverId?: string

  private shadow: Phaser.GameObjects.Image
  private chassis: Phaser.GameObjects.Image
  private dialogBox: Phaser.GameObjects.Container
  private facing: CarDirection = 'down'

  constructor(scene: Phaser.Scene, x: number, y: number, vehicleId: string, areaId: string) {
    super(scene, x, y)
    createCarTextures(scene)

    this.vehicleId = vehicleId
    this.areaId = areaId

    this.shadow = scene.add.image(0, 16, CAR_KEYS.shadow)
    this.chassis = scene.add.image(0, 0, CAR_KEYS.down)
    this.add([this.shadow, this.chassis])
    this.setSize(44, 44)

    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.park(x, y)

    this.dialogBox = scene.add.container().setDepth(10000)
  }

  private get staticBody() {
    return this.body as Phaser.Physics.Arcade.StaticBody
  }

  setFacing(direction: CarDirection) {
    if (this.facing === direction) return
    this.facing = direction
    this.chassis.setTexture(carKeyForDirection(direction))
  }

  /** Follow the driver; the collider is off so you never bump your own car. */
  driveTo(x: number, y: number) {
    this.setPosition(x, y - 6)
    this.setDepth(y + 1)
    this.staticBody.enable = false
  }

  park(x: number, y: number) {
    this.setPosition(x, y)
    this.setDepth(y)
    const body = this.staticBody
    body.enable = true
    body.position.set(x - body.halfWidth, y - body.halfHeight)
    body.updateCenter()
  }

  onOverlapDialog() {
    this.setDialogBox('Press E to drive')
  }

  setDialogBox(text: string) {
    this.clearDialogBox()
    const innerText = this.scene.add
      .text(0, 0, text)
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#041016')
    const w = innerText.width + 6
    const h = innerText.height + 3
    const bx = this.x - w * 0.5
    const by = this.y - 44
    this.dialogBox.add(
      this.scene.add
        .graphics()
        .fillStyle(0xfde68a, 1)
        .fillRoundedRect(bx, by, w, h, 4)
        .lineStyle(1.5, 0xfb7185, 1)
        .strokeRoundedRect(bx, by, w, h, 4)
    )
    this.dialogBox.add(innerText.setPosition(bx + 3, by + 1))
  }

  clearDialogBox() {
    this.dialogBox.removeAll(true)
  }
}
