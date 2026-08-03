import Phaser from 'phaser'
import MyPlayer from './MyPlayer'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import Interactable from '../items/Interactable'
import { NavKeys } from '../../../types/KeyboardState'
export default class PlayerSelector extends Phaser.GameObjects.Zone {
  selectedItem?: Interactable

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y, width, height)

    scene.physics.add.existing(this)
  }

  update(player: MyPlayer, cursors: NavKeys) {
    if (!cursors) {
      return
    }

    // no need to update player selection while sitting
    if (player.playerBehavior === PlayerBehavior.SITTING) {
      return
    }

    // update player selection box position so that it's always in front of the player
    const { x, y } = player
    if (cursors.left?.isDown || cursors.A?.isDown) {
      this.setPosition(x - 32, y)
    } else if (cursors.right?.isDown || cursors.D?.isDown) {
      this.setPosition(x + 32, y)
    } else if (cursors.up?.isDown || cursors.W?.isDown) {
      this.setPosition(x, y - 32)
    } else if (cursors.down?.isDown || cursors.S?.isDown) {
      this.setPosition(x, y + 32)
    }

    // while currently selecting an item,
    // if the selector and selection item stop overlapping, clear the dialog box and selected item
    if (this.selectedItem) {
      const selectedGameObject = this.selectedItem as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType
      if (!this.scene.physics.overlap(this, selectedGameObject)) {
        this.selectedItem.clearDialogBox()
        this.selectedItem = undefined
      }
    }
  }
}
