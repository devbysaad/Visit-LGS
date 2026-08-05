import Phaser from 'phaser'
import { ItemType } from '../../../types/Items'
import Interactable from '../items/Interactable'
import { phaserEvents, Event } from '../events/EventCenter'

/**
 * Writable board trigger from Tiled `boards` layer.
 * Shows a whiteboard sprite and opens the shared board UI on E.
 */
export default class BoardZone extends Phaser.GameObjects.Zone implements Interactable {
  itemType = ItemType.BOARD
  boardId: string
  displayName: string

  private dialogBox: Phaser.GameObjects.Container
  private sprite?: Phaser.GameObjects.Image

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    boardId: string,
    displayName: string
  ) {
    super(scene, x, y, Math.max(width, 64), Math.max(height, 48))
    this.boardId = boardId
    this.displayName = displayName
    this.dialogBox = scene.add.container().setDepth(10000)

    if (scene.textures.exists('whiteboard')) {
      // Keep the board art on the wall; the zone extends south for easier Press E
      this.sprite = scene.add
        .image(x, y - height * 0.35, 'whiteboard', 0)
        .setDepth(y)
        .setScale(0.85)
    }
  }

  onOverlapDialog() {
    this.setDialogBox('Press E — campus notice board')
  }

  onInteract() {
    phaserEvents.emit(Event.BOARD_INTERACT, this.boardId)
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
