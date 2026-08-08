import Phaser from 'phaser'

/**
 * The campus car has no art in the tilesets, so we bake four top-down views at
 * boot. Keeping it procedural means the vehicle always matches the theme colours
 * and never 404s on a missing sprite sheet.
 */

export const CAR_KEYS = {
  down: 'car_down',
  up: 'car_up',
  left: 'car_left',
  right: 'car_right',
  shadow: 'car_shadow',
} as const

const BODY = 0xfb7185
const BODY_DARK = 0xc2485c
const GLASS = 0x0b1f24
const GLASS_LIT = 0x2f6f79
const TRIM = 0xfde68a
const TYRE = 0x14161c

type Ctx = Phaser.GameObjects.Graphics

function roundRect(g: Ctx, x: number, y: number, w: number, h: number, r: number, color: number, alpha = 1) {
  g.fillStyle(color, alpha)
  g.fillRoundedRect(x, y, w, h, r)
}

function drawVertical(g: Ctx, facingDown: boolean) {
  const W = 34
  const H = 54

  // tyres
  roundRect(g, 1, 10, 6, 12, 2, TYRE)
  roundRect(g, W - 7, 10, 6, 12, 2, TYRE)
  roundRect(g, 1, H - 24, 6, 12, 2, TYRE)
  roundRect(g, W - 7, H - 24, 6, 12, 2, TYRE)

  // body
  roundRect(g, 3, 2, W - 6, H - 4, 9, BODY)
  roundRect(g, 3, facingDown ? H - 16 : 2, W - 6, 14, 9, BODY_DARK, 0.45)

  // cabin glass
  const glassY = facingDown ? 14 : H - 30
  roundRect(g, 7, glassY, W - 14, 16, 5, GLASS)
  roundRect(g, 9, glassY + 2, W - 18, 6, 3, GLASS_LIT, 0.5)

  // windscreen at the leading edge
  const screenY = facingDown ? H - 15 : 5
  roundRect(g, 6, screenY, W - 12, 10, 4, GLASS)

  // roof stripe + lights
  roundRect(g, W / 2 - 2, 16, 4, H - 32, 2, TRIM, 0.65)
  const lightY = facingDown ? H - 6 : 2
  roundRect(g, 6, lightY, 7, 4, 2, TRIM)
  roundRect(g, W - 13, lightY, 7, 4, 2, TRIM)
}

function drawHorizontal(g: Ctx, facingRight: boolean) {
  const W = 54
  const H = 34

  roundRect(g, 10, 1, 12, 6, 2, TYRE)
  roundRect(g, 10, H - 7, 12, 6, 2, TYRE)
  roundRect(g, W - 24, 1, 12, 6, 2, TYRE)
  roundRect(g, W - 24, H - 7, 12, 6, 2, TYRE)

  roundRect(g, 2, 3, W - 4, H - 6, 9, BODY)
  roundRect(g, facingRight ? 2 : W - 16, 3, 14, H - 6, 9, BODY_DARK, 0.45)

  roundRect(g, 16, 7, 22, H - 14, 5, GLASS)
  roundRect(g, 18, 9, 18, 5, 3, GLASS_LIT, 0.5)

  const screenX = facingRight ? W - 15 : 5
  roundRect(g, screenX, 6, 10, H - 12, 4, GLASS)

  roundRect(g, 16, H / 2 - 2, W - 32, 4, 2, TRIM, 0.65)
  const lightX = facingRight ? W - 6 : 2
  roundRect(g, lightX, 6, 4, 7, 2, TRIM)
  roundRect(g, lightX, H - 13, 4, 7, 2, TRIM)
}

let baked = false

export function createCarTextures(scene: Phaser.Scene) {
  if (baked && scene.textures.exists(CAR_KEYS.down)) return
  baked = true

  const bake = (key: string, w: number, h: number, draw: (g: Ctx) => void) => {
    if (scene.textures.exists(key)) return
    const g = scene.make.graphics({ x: 0, y: 0 }, false)
    draw(g)
    g.generateTexture(key, w, h)
    g.destroy()
  }

  bake(CAR_KEYS.down, 34, 54, (g) => drawVertical(g, true))
  bake(CAR_KEYS.up, 34, 54, (g) => drawVertical(g, false))
  bake(CAR_KEYS.right, 54, 34, (g) => drawHorizontal(g, true))
  bake(CAR_KEYS.left, 54, 34, (g) => drawHorizontal(g, false))
  bake(CAR_KEYS.shadow, 60, 26, (g) => {
    g.fillStyle(0x000000, 0.28)
    g.fillEllipse(30, 13, 56, 20)
  })
}

export function carKeyForDirection(dir: 'up' | 'down' | 'left' | 'right') {
  return CAR_KEYS[dir]
}
