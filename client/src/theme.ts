/**
 * CampusQuest — Gudwal visual identity (NOT SkyOffice slate, NOT NUST navy/gold).
 */

export const cq = {
  deep: '#0b1f24',
  panel: '#123338',
  panelLit: '#1a4a50',
  coral: '#fb7185',
  coralHot: '#fda4af',
  butter: '#fde68a',
  mist: '#e0f2f1',
  muted: '#94b0b4',
  ink: '#041016',
} as const

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function mix(hexA: string, hexB: string, t: number) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

export function alpha(color: string, a: number) {
  if (color.startsWith('rgb')) {
    const [r, g, b] = color.match(/\d+/g)!.map(Number)
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  const { r, g, b } = hexToRgb(color)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export const surface = {
  base: cq.deep,
  raised: cq.panel,
  alt: cq.panelLit,
  scrim: 'rgba(4, 16, 22, 0.88)',
} as const

export const text = {
  primary: cq.mist,
  muted: cq.muted,
  onCoral: cq.ink,
  accent: cq.coral,
  butter: cq.butter,
} as const

export const accent = {
  coral: cq.coral,
  coralHot: cq.coralHot,
  butter: cq.butter,
  mint: cq.coral, // legacy alias — UI should prefer coral
  mintHot: cq.coralHot,
  glow: cq.butter,
} as const

export const border = {
  subtle: '#ffffff1a',
  mint: alpha(cq.coral, 0.5),
  strong: alpha(cq.butter, 0.45),
} as const

/** Fraunces + Manrope — nothing like NUST Georgia/Avenir or SkyOffice Arial. */
export const font = {
  display: `"Fraunces", "Palatino Linotype", serif`,
  body: `"Manrope", "Avenir Next", sans-serif`,
  mono: `"IBM Plex Mono", ui-monospace, monospace`,
} as const

export const radius = {
  sm: '10px',
  md: '16px',
  lg: '28px',
} as const

export const shadow = {
  panel: '0 24px 64px rgba(0, 0, 0, 0.55)',
} as const
