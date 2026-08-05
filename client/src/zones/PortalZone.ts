import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Interactable from '../items/Interactable'
import { phaserEvents, Event } from '../events/EventCenter'

export type PortalTarget = {
  portalId: string
  targetArea: string
  spawnX: number
  spawnY: number
  label: string
}

/**
 * Door portal between outdoor campus and a building interior island.
 */
export default class PortalZone extends Phaser.GameObjects.Zone implements Interactable {
  itemType = ItemType.PORTAL
  portal: PortalTarget

  private dialogBox: Phaser.GameObjects.Container

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    portal: PortalTarget
  ) {
    super(scene, x, y, width, height)
    this.portal = portal
    this.dialogBox = scene.add.container().setDepth(10000)
  }

  onOverlapDialog() {
    this.setDialogBox(`Press E — ${this.portal.label}`)
  }

  onInteract() {
    phaserEvents.emit(Event.PORTAL_ENTER, this.portal)
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
