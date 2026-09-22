// Derives the full brand CSS-variable palette from the two colors an admin
// picks in Settings → Colors. Mirrors the token names in app/globals.css so
// the override is a drop-in replacement for the :root block there.

function clamp(n: number) {
  return Math.max(0, Math.min(255, n))
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim())
  if (!m) return null
  const int = parseInt(m[1], 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

function rgbToHex(r: number, g: number, b: number) {
  const h = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Mix a color toward white (amount 0–1) — used for pale/wash tints */
function tint(hex: string, amount: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

/** Mix a color toward black (amount 0–1) — used for deep/darker shades */
function shade(hex: string, amount: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

export interface BrandPalette {
  oxblood: string
  oxbloodDeep: string
  crimson: string
  redMid: string
  redBright: string
  redSoft: string
  redPale: string
  redWash: string
}

const FALLBACK_PRIMARY = '#4a0e0e'
const FALLBACK_ACCENT = '#c41e3a'

export function buildPalette(primaryHex?: string, accentHex?: string): BrandPalette {
  const primary = hexToRgb(primaryHex || '') ? (primaryHex as string) : FALLBACK_PRIMARY
  const accent = hexToRgb(accentHex || '') ? (accentHex as string) : FALLBACK_ACCENT

  return {
    oxblood: primary,
    oxbloodDeep: shade(primary, 0.35),
    crimson: shade(accent, 0.2),
    redMid: accent,
    redBright: accent,
    redSoft: tint(accent, 0.25),
    redPale: tint(accent, 0.92),
    redWash: tint(primary, 0.97),
  }
}

/** CSS custom-property override block, injected as inline <style> in <head>. */
export function paletteToCss(p: BrandPalette) {
  return `:root{--oxblood:${p.oxblood};--oxblood-deep:${p.oxbloodDeep};--crimson:${p.crimson};--red-mid:${p.redMid};--red-bright:${p.redBright};--red-soft:${p.redSoft};--red-pale:${p.redPale};--red-wash:${p.redWash};}`
}
