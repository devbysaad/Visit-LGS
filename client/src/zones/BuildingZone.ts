import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Interactable from '../items/Interactable'
import { phaserEvents, Event } from '../events/EventCenter'

/**
 * Invisible trigger placed from the `buildings` Tiled object layer (see
 * docs/MAP_SPEC.md). Shows a "Press E to enter" prompt on overlap and emits a
 * phaserEvent on E — Phaser never touches Redux directly, a store subscribes
 * to Event.BUILDING_INTERACT instead.
 */
export default class BuildingZone extends Phaser.GameObjects.Zone implements Interactable {
  itemType = ItemType.BUILDING
  buildingId: string
  displayName: string

  private dialogBox: Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    buildingId: string,
    displayName: string
  ) {
    super(scene, x, y, width, height)
    this.buildingId = buildingId
    this.displayName = displayName
    this.dialogBox = scene.add.container().setDepth(10000)
  }

  onOverlapDialog() {
    this.setDialogBox(`Walk in · Press E for ${this.displayName}`)
  }

  onInteract() {
    phaserEvents.emit(Event.BUILDING_INTERACT, this.buildingId)
  }

  private setDialogBox(text: string) {
    this.clearDialogBox()

    const innerText = this.scene.add
      .text(0, 0, text)
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')

    const dialogBoxWidth = innerText.width + 4
    const dialogBoxHeight = innerText.height + 2
    const dialogBoxX = this.x - dialogBoxWidth * 0.5
    const dialogBoxY = this.y - this.height * 0.5 - dialogBoxHeight - 4

    this.dialogBox.add(
      this.scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
        .lineStyle(1.5, 0x000000, 1)
        .strokeRoundedRect(dialogBoxX, dialogBoxY, dialogBoxWidth, dialogBoxHeight, 3)
    )
    this.dialogBox.add(innerText.setPosition(dialogBoxX + 2, dialogBoxY))
  }

  clearDialogBox() {
    this.dialogBox.removeAll(true)
  }
}
