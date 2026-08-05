import Phaser from 'phaser'

const TEXTURES = ['ash', 'lucy', 'nancy', 'adam']

/**
 * Local-only ambient student/staff who patrol inside an interior area.
 * Not networked — decorative life on campus interiors.
 */
export default class AmbientCharacter extends Phaser.Physics.Arcade.Sprite {
  areaId: string
  private homeX: number
  private homeY: number
  private roamRadius: number
  private targetX: number
  private targetY: number
  private waitUntil = 0
  private textureKey: string

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    areaId: string,
    textureIndex: number
  ) {
    const texture = TEXTURES[textureIndex % TEXTURES.length]
    super(scene, x, y, texture)
    this.areaId = areaId
    this.textureKey = texture
    this.homeX = x
    this.homeY = y
    this.roamRadius = 48 + (textureIndex % 3) * 16
    this.targetX = x
    this.targetY = y

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(y)
    this.anims.play(`${texture}_idle_down`, true)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(this.width * 0.5, this.height * 0.2)
  }

  setAreaVisible(currentAreaId: string) {
    const show = this.areaId === currentAreaId
    this.setVisible(show)
    this.setActive(show)
    if (!show) {
      this.setVelocity(0, 0)
    }
  }

  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)
    if (!this.visible || !this.active) return

    if (t < this.waitUntil) {
      this.setVelocity(0, 0)
      return
    }

    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.hypot(dx, dy)
    const speed = 55

    if (dist < 4) {
      this.setVelocity(0, 0)
      this.pickIdleAnim()
      this.waitUntil = t + 900 + Math.random() * 1600
      this.pickNextTarget()
      return
    }

    const vx = (dx / dist) * speed
    const vy = (dy / dist) * speed
    this.setVelocity(vx, vy)
    this.setDepth(this.y)

    if (Math.abs(vx) > Math.abs(vy)) {
      this.anims.play(`${this.textureKey}_run_${vx > 0 ? 'right' : 'left'}`, true)
    } else {
      this.anims.play(`${this.textureKey}_run_${vy > 0 ? 'down' : 'up'}`, true)
    }
  }

  private pickIdleAnim() {
    const parts = this.anims.currentAnim?.key.split('_') ?? [this.textureKey, 'idle', 'down']
    parts[1] = 'idle'
    this.anims.play(parts.join('_'), true)
  }

  private pickNextTarget() {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * this.roamRadius
    this.targetX = this.homeX + Math.cos(angle) * radius
    this.targetY = this.homeY + Math.sin(angle) * radius
  }
}
