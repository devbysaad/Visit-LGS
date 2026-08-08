import Phaser from 'phaser'

/**
 * Procedural set dressing for the outdoor campus: trees, lamp posts, planters
 * and a screen vignette. Everything is baked from Graphics at boot so we do not
 * depend on tileset art that does not exist, and the palette always matches
 * client/src/theme.ts.
 */

const TEX = {
  tree: 'decor_tree',
  palm: 'decor_palm',
  lamp: 'decor_lamp',
  planter: 'decor_planter',
  blob: 'decor_shadow',
  vignette: 'decor_vignette',
} as const

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return
  const g = scene.make.graphics({ x: 0, y: 0 }, false)
  draw(g)
  g.generateTexture(key, w, h)
  g.destroy()
}

function bakeAll(scene: Phaser.Scene) {
  bake(scene, TEX.blob, 48, 20, (g) => {
    g.fillStyle(0x04202a, 0.3)
    g.fillEllipse(24, 10, 42, 16)
  })

  bake(scene, TEX.tree, 56, 76, (g) => {
    g.fillStyle(0x5b3a24, 1)
    g.fillRect(25, 44, 7, 28)
    g.fillStyle(0x1f5f4a, 1)
    g.fillCircle(28, 34, 20)
    g.fillCircle(16, 42, 13)
    g.fillCircle(40, 42, 13)
    g.fillStyle(0x2f8a68, 1)
    g.fillCircle(24, 28, 14)
    g.fillCircle(36, 34, 10)
    g.fillStyle(0x63c79b, 0.5)
    g.fillCircle(21, 24, 7)
  })

  bake(scene, TEX.palm, 56, 84, (g) => {
    g.fillStyle(0x6b4a2c, 1)
    g.fillRect(26, 34, 6, 46)
    g.fillStyle(0x2f8a68, 1)
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6
      g.fillEllipse(28 + Math.cos(a) * 16, 32 + Math.sin(a) * 10, 26, 12)
    }
    g.fillStyle(0x63c79b, 0.7)
    g.fillCircle(28, 32, 8)
  })

  bake(scene, TEX.lamp, 20, 76, (g) => {
    g.fillStyle(0x1b2b30, 1)
    g.fillRect(8, 18, 4, 54)
    g.fillRect(4, 70, 12, 5)
    g.fillStyle(0x24383e, 1)
    g.fillRoundedRect(3, 8, 14, 12, 4)
    g.fillStyle(0xfde68a, 1)
    g.fillRoundedRect(5, 12, 10, 6, 3)
  })

  bake(scene, TEX.planter, 40, 40, (g) => {
    g.fillStyle(0x2a4148, 1)
    g.fillRoundedRect(4, 20, 32, 16, 5)
    g.fillStyle(0x2f8a68, 1)
    g.fillCircle(14, 18, 9)
    g.fillCircle(26, 18, 9)
    g.fillStyle(0xfb7185, 0.85)
    g.fillCircle(20, 12, 4)
  })
}

/** Cheap deterministic hash so decor placement is stable between reloads. */
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export interface DecorOptions {
  groundLayer: Phaser.Tilemaps.TilemapLayer
  grassFirstGid: number
  outdoor: { x: number; y: number; width: number; height: number }
}

export function decorateCampus(scene: Phaser.Scene, { groundLayer, grassFirstGid, outdoor }: DecorOptions) {
  bakeAll(scene)

  const TILE = 32
  const grass = new Set([grassFirstGid, grassFirstGid + 1, grassFirstGid + 2])
  const startX = Math.floor(outdoor.x / TILE)
  const startY = Math.floor(outdoor.y / TILE)
  const endX = Math.floor((outdoor.x + outdoor.width) / TILE)
  const endY = Math.floor((outdoor.y + outdoor.height) / TILE)

  const isClearGrass = (tx: number, ty: number) => {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tile = groundLayer.getTileAt(tx + dx, ty + dy)
        if (!tile || !grass.has(tile.index)) return false
      }
    }
    return true
  }

  const place = (key: string, x: number, y: number, scale = 1) => {
    scene.add
      .image(x, y + 4, TEX.blob)
      .setDepth(y - 1)
      .setScale(scale * 0.8)
      .setAlpha(0.5)
    scene.add.image(x, y, key).setOrigin(0.5, 0.92).setDepth(y).setScale(scale)
  }

  let planted = 0
  for (let ty = startY + 2; ty < endY - 2; ty += 3) {
    for (let tx = startX + 2; tx < endX - 2; tx += 3) {
      const r = hash(tx, ty)
      if (r > 0.22) continue
      if (!isClearGrass(tx, ty)) continue
      const x = tx * TILE + TILE / 2
      const y = ty * TILE + TILE
      if (r < 0.05) place(TEX.palm, x, y, 0.95)
      else if (r < 0.17) place(TEX.tree, x, y, 0.9 + (r % 0.02) * 6)
      else place(TEX.planter, x, y, 0.9)
      planted++
    }
  }

  return planted
}

/** Lamp posts with a warm pool of light, placed along a road. */
export function addLampRow(
  scene: Phaser.Scene,
  points: Array<{ x: number; y: number }>
) {
  bakeAll(scene)
  points.forEach(({ x, y }) => {
    const glow = scene.add.circle(x, y + 6, 46, 0xfde68a, 0.1).setDepth(y - 2)
    scene.add.image(x, y, TEX.lamp).setOrigin(0.5, 0.95).setDepth(y)
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.07, to: 0.15 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  })
}

interface FacadeStyle {
  roof: number
  roofLit: number
  parapet: number
  trim: number
}

/** One palette per building so the campus reads at a glance from the minimap. */
const FACADE_STYLES: Record<string, FacadeStyle> = {
  teal: { roof: 0x2b6f7a, roofLit: 0x3d8b96, parapet: 0x1b4a52, trim: 0xfde68a },
  plum: { roof: 0x6d4360, roofLit: 0x8a5a7b, parapet: 0x4a2c42, trim: 0xfbcfe8 },
  terracotta: { roof: 0x9c5a3c, roofLit: 0xba7350, parapet: 0x6d3c26, trim: 0xfde68a },
  moss: { roof: 0x3f6b4a, roofLit: 0x568a61, parapet: 0x2a4a32, trim: 0xd9f99d },
  amber: { roof: 0xa8763a, roofLit: 0xc7924f, parapet: 0x75521f, trim: 0xfde68a },
  indigo: { roof: 0x445a8c, roofLit: 0x5c74a8, parapet: 0x2e3c60, trim: 0xbfdbfe },
  slate: { roof: 0x4d5b61, roofLit: 0x66777e, parapet: 0x333e43, trim: 0xfde68a },
}

const GLASS = 0x0d2a30
const GLASS_LIT = 0xfde68a

/**
 * Draws a raised, lit building over each flat outdoor shell: drop shadow, roof
 * slab with a parapet, a window grid (one row per storey) and an entrance
 * canopy. The tilemap keeps the collision; this is purely how it looks.
 *
 * The two academic wings are very long, so the facade is broken into bays with
 * pilasters between them — an unbroken 2400px window strip reads as a wall.
 */
export function drawFacades(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap) {
  const layer = map.getObjectLayer('facades')
  if (!layer) return 0

  const BAY_W = 320

  layer.objects.forEach((object) => {
    const props = (object.properties ?? []) as Array<{ name: string; value: unknown }>
    const read = (name: string) => props.find((p) => p.name === name)?.value
    const style = FACADE_STYLES[String(read('style') ?? 'slate')] ?? FACADE_STYLES.slate
    const storeys = Number(read('storeys') ?? 1)
    const label = String(read('label') ?? '')
    const doorSide = String(read('doorSide') ?? 's')

    const x = object.x ?? 0
    const y = object.y ?? 0
    const w = object.width ?? 32
    const h = object.height ?? 32
    const bottom = y + h

    const g = scene.add.graphics().setDepth(bottom)

    g.fillStyle(0x02141a, 0.35)
    g.fillRoundedRect(x + 6, y + 14, w, h, 10)

    g.fillStyle(style.roof, 1)
    g.fillRoundedRect(x, y, w, h, 10)
    g.fillStyle(style.roofLit, 0.55)
    g.fillRoundedRect(x + 4, y + 4, w - 8, Math.min(28, h * 0.28), 8)

    // parapet along the front edge reads as height from a top-down camera
    g.fillStyle(style.parapet, 1)
    g.fillRoundedRect(x, bottom - 22, w, 22, { tl: 0, tr: 0, bl: 10, br: 10 })
    g.lineStyle(2, style.trim, 0.35)
    g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 10)

    // window grid, one band per storey
    const bands = Math.max(1, storeys)
    const usable = h - 44
    const bandH = usable / bands
    const cols = Math.max(2, Math.floor((w - 40) / 42))
    const winW = 24
    const winH = Math.min(18, bandH * 0.42)
    for (let b = 0; b < bands; b++) {
      const wy = y + 26 + b * bandH + (bandH - winH) / 2
      for (let c = 0; c < cols; c++) {
        const wx = x + 20 + c * ((w - 40) / cols) + ((w - 40) / cols - winW) / 2
        const lit = hash(wx + b, wy + c) > 0.62
        g.fillStyle(lit ? GLASS_LIT : GLASS, lit ? 0.75 : 0.85)
        g.fillRoundedRect(wx, wy, winW, winH, 4)
      }
      if (b < bands - 1) {
        g.fillStyle(style.parapet, 0.5)
        g.fillRect(x + 10, y + 26 + (b + 1) * bandH - 3, w - 20, 3)
      }
    }

    // pilasters break a long wing into bays so it does not read as one slab
    const bays = Math.floor(w / BAY_W)
    for (let i = 1; i < bays; i++) {
      const px = x + (i * w) / bays
      g.fillStyle(style.parapet, 0.75)
      g.fillRect(px - 5, y + 18, 10, h - 36)
      g.fillStyle(style.trim, 0.2)
      g.fillRect(px - 1, y + 18, 2, h - 36)
    }

    // entrance canopy on the door side
    const canopyW = Math.min(140, Math.max(76, w * 0.06))
    if (doorSide === 's') {
      g.fillStyle(style.trim, 0.9)
      g.fillRoundedRect(x + w / 2 - canopyW / 2, bottom - 14, canopyW, 16, 6)
      g.fillStyle(GLASS, 0.9)
      g.fillRoundedRect(x + w / 2 - canopyW / 4, bottom - 40, canopyW / 2, 26, 5)
    }

    if (label) {
      scene.add
        .text(x + w / 2, y + 12, label, {
          fontFamily: 'Manrope, Avenir Next, sans-serif',
          fontSize: '13px',
          color: '#e0f2f1',
        })
        .setOrigin(0.5, 0)
        .setDepth(bottom + 1)
        .setAlpha(0.9)
    }
  })

  return layer.objects.length
}

/**
 * Props placed from the map's `props` layer: road centre-lines, the playground
 * kit, bins, the flagpole and the car-park sign outdoors, plus the trees,
 * benches, planters and stair flights that dress the wing courtyards,
 * terraces, stairwells and the east walking area.
 */
export function drawProps(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap) {
  const layer = map.getObjectLayer('props')
  if (!layer) return 0

  bakeAll(scene)

  const placeBaked = (key: string, x: number, y: number, scale = 1) => {
    scene.add
      .image(x, y + 4, TEX.blob)
      .setDepth(y - 1)
      .setScale(scale * 0.8)
      .setAlpha(0.5)
    scene.add.image(x, y, key).setOrigin(0.5, 0.92).setDepth(y).setScale(scale)
  }

  layer.objects.forEach((object) => {
    const props = (object.properties ?? []) as Array<{ name: string; value: unknown }>
    const kind = String(props.find((p) => p.name === 'kind')?.value ?? '')
    const rot = Number(props.find((p) => p.name === 'rotation')?.value ?? 0)
    const x = object.x ?? 0
    const y = object.y ?? 0

    if (kind === 'dash') {
      const g = scene.add.graphics().setDepth(1)
      g.fillStyle(0xf5f0e6, 0.5)
      if (rot === 90) g.fillRoundedRect(x - 3, y - 22, 6, 44, 3)
      else g.fillRoundedRect(x - 22, y - 3, 44, 6, 3)
      return
    }

    if (kind === 'tree' || kind === 'palm' || kind === 'planter') {
      placeBaked(kind === 'tree' ? TEX.tree : kind === 'palm' ? TEX.palm : TEX.planter, x, y, 0.9)
      return
    }

    if (kind === 'lamp') {
      addLampRow(scene, [{ x, y }])
      return
    }

    const g = scene.add.graphics().setDepth(y)
    const shadow = () => {
      g.fillStyle(0x02141a, 0.25)
      g.fillEllipse(x, y + 10, 40, 14)
    }

    switch (kind) {
      case 'bench':
        shadow()
        g.fillStyle(0x5b3a24, 1)
        g.fillRoundedRect(x - 26, y - 14, 52, 8, 3)
        g.fillRoundedRect(x - 26, y - 26, 52, 7, 3)
        g.fillStyle(0x2a4148, 1)
        g.fillRect(x - 22, y - 8, 5, 12)
        g.fillRect(x + 17, y - 8, 5, 12)
        break
      case 'stairs': {
        // A flight seen from above: treads narrowing towards the upper landing
        g.fillStyle(0x02141a, 0.2)
        g.fillRoundedRect(x - 46, y - 54, 92, 104, 8)
        for (let step = 0; step < 8; step++) {
          const inset = step * 2
          g.fillStyle(step % 2 === 0 ? 0x38535b : 0x2c454c, 1)
          g.fillRect(x - 40 + inset, y - 48 + step * 12, 80 - inset * 2, 10)
        }
        g.lineStyle(3, 0xfde68a, 0.5)
        g.lineBetween(x - 42, y - 50, x - 42, y + 46)
        g.lineBetween(x + 42, y - 50, x + 42, y + 46)
        break
      }
      case 'goal':
        shadow()
        g.lineStyle(5, 0xf5f0e6, 0.95)
        g.strokeRoundedRect(x - 34, y - 40, 68, 44, 4)
        g.lineStyle(1, 0xf5f0e6, 0.35)
        for (let i = -30; i < 32; i += 8) g.lineBetween(x + i, y - 38, x + i, y + 2)
        break
      case 'swing':
        shadow()
        g.lineStyle(5, 0x4d5b61, 1)
        g.lineBetween(x - 26, y + 4, x - 10, y - 38)
        g.lineBetween(x + 26, y + 4, x + 10, y - 38)
        g.lineBetween(x - 10, y - 38, x + 10, y - 38)
        g.lineStyle(3, 0x8a949a, 1)
        g.lineBetween(x - 4, y - 38, x - 4, y - 12)
        g.lineBetween(x + 4, y - 38, x + 4, y - 12)
        g.fillStyle(0xfb7185, 1)
        g.fillRoundedRect(x - 10, y - 12, 20, 6, 3)
        break
      case 'slide':
        shadow()
        g.fillStyle(0x4d5b61, 1)
        g.fillRoundedRect(x - 22, y - 44, 14, 48, 4)
        g.fillStyle(0xfde68a, 1)
        g.fillTriangle(x - 10, y - 42, x + 26, y + 2, x - 4, y + 2)
        g.fillStyle(0x2f8a68, 1)
        g.fillRoundedRect(x - 26, y - 52, 22, 12, 4)
        break
      case 'sandpit':
        g.fillStyle(0xd9c08a, 1)
        g.fillRoundedRect(x - 46, y - 24, 92, 48, 14)
        g.lineStyle(4, 0x8a6f42, 0.9)
        g.strokeRoundedRect(x - 46, y - 24, 92, 48, 14)
        break
      case 'flagpole':
        shadow()
        g.fillStyle(0xd7dee1, 1)
        g.fillRect(x - 2, y - 76, 4, 80)
        g.fillStyle(0x2f8a68, 1)
        g.fillTriangle(x + 2, y - 74, x + 34, y - 64, x + 2, y - 52)
        g.fillStyle(0x1b4a52, 1)
        g.fillCircle(x, y + 2, 9)
        break
      case 'bin':
        shadow()
        g.fillStyle(0x1f5f4a, 1)
        g.fillRoundedRect(x - 9, y - 22, 18, 24, 4)
        g.fillStyle(0x2f8a68, 1)
        g.fillRoundedRect(x - 11, y - 26, 22, 6, 3)
        break
      case 'sign-parking':
        shadow()
        g.fillStyle(0x4d5b61, 1)
        g.fillRect(x - 2, y - 34, 4, 36)
        g.fillStyle(0x123338, 1)
        g.fillRoundedRect(x - 20, y - 54, 40, 24, 5)
        g.lineStyle(2, 0xfde68a, 0.9)
        g.strokeRoundedRect(x - 20, y - 54, 40, 24, 5)
        scene.add
          .text(x, y - 42, 'P', {
            fontFamily: 'Fraunces, serif',
            fontSize: '16px',
            color: '#fde68a',
          })
          .setOrigin(0.5)
          .setDepth(y + 1)
        break
    }
  })

  return layer.objects.length
}

/** Screen-space vignette that sits under the DOM UI but over the world. */
export function addVignette(scene: Phaser.Scene): Phaser.GameObjects.Image | undefined {
  const { width, height } = scene.scale
  const key = TEX.vignette
  if (!scene.textures.exists(key)) {
    const canvas = scene.textures.createCanvas(key, width, height)
    if (!canvas) return undefined
    const ctx = canvas.getContext()
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    )
    gradient.addColorStop(0, 'rgba(4, 16, 22, 0)')
    gradient.addColorStop(1, 'rgba(4, 16, 22, 0.55)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    canvas.refresh()
  }

  return scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(19000)
}
