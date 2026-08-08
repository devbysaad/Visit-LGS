import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Interactable from '../items/Interactable'
import { phaserEvents, Event } from '../events/EventCenter'

export default class EggZone extends Phaser.GameObjects.Zone implements Interactable {
  itemType = ItemType.EGG
  eggId: string

  private dialogBox: Phaser.GameObjects.Container
  private marker: Phaser.GameObjects.Arc

  constructor(scene: Phaser.Scene, x: number, y: number, eggId: string) {
    super(scene, x, y, 40, 40)
    this.eggId = eggId
    this.dialogBox = scene.add.container().setDepth(10000)
    this.marker = scene.add.circle(x, y - 10, 6, 0xfb7185, 0.9).setDepth(y)
    scene.add.circle(x, y - 10, 10, 0xfde68a, 0.25).setDepth(y - 1)
  }

  onOverlapDialog() {
    this.setDialogBox('Press E — campus clue')
  }

  onInteract() {
    phaserEvents.emit(Event.EGG_INTERACT, this.eggId)
  }

  private setDialogBox(text: string) {
    this.clearDialogBox()
    const innerText = this.scene.add
      .text(0, 0, text)
      .setFontFamily('Arial')
      .setFontSize(12)
      .setColor('#000000')
    const w = innerText.width + 4
    const h = innerText.height + 2
    const bx = this.x - w * 0.5
    const by = this.y - this.height * 0.5 - h - 8
    this.dialogBox.add(
      this.scene.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(bx, by, w, h, 3)
        .lineStyle(1.5, 0xfb7185, 1)
        .strokeRoundedRect(bx, by, w, h, 3)
    )
    this.dialogBox.add(innerText.setPosition(bx + 2, by))
  }

  clearDialogBox() {
    this.dialogBox.removeAll(true)
  }
}
