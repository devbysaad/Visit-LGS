import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Interactable from '../items/Interactable'
import { phaserEvents, Event } from '../events/EventCenter'

/**
 * Invisible trigger placed from the `npcs` Tiled object layer (see
 * docs/MAP_SPEC.md), anchored on top of a visible idle character sprite.
 * Shows a "Press E to talk" prompt on overlap and emits a phaserEvent on E.
 */
export default class NpcZone extends Phaser.GameObjects.Zone implements Interactable {
  itemType = ItemType.NPC
  npcId: string
  displayName: string

  private dialogBox: Phaser.GameObjects.Container
  private sprite: Phaser.GameObjects.Sprite

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    npcId: string,
    displayName: string,
    texture: string
  ) {
    super(scene, x, y, width, height)
    this.npcId = npcId
    this.displayName = displayName
    this.dialogBox = scene.add.container().setDepth(10000)

    this.sprite = scene.add.sprite(x, y, texture).setDepth(y)
    this.sprite.anims.play(`${texture}_idle_down`, true)
  }

  onOverlapDialog() {
    this.setDialogBox(`Press E to talk to ${this.displayName}`)
  }

  onInteract() {
    phaserEvents.emit(Event.NPC_INTERACT, this.npcId)
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

  destroy(fromScene?: boolean) {
    this.sprite.destroy(fromScene)
    this.dialogBox.destroy()
    super.destroy(fromScene)
  }
}
