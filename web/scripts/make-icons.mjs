/**
 * web/scripts/make-icons.mjs
 * Generates favicon-32.png, icon-192.png, icon-512.png, apple-touch-icon.png
 * (180x180) and og-image.png (1200x630) with a zero-dependency PNG encoder.
 *
 * Run: node scripts/make-icons.mjs   (from web/)
 * The sandbox has no ImageMagick; hand-drawing the few raster assets the
 * manifest + og tags need beats shipping a canvas dependency.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const COLORS = {
  paper: [11, 20, 24],        // #0b1418
  surface: [15, 29, 34],      // #0f1d22
  accent: [79, 214, 194],     // #4fd6c2
  accentDeep: [51, 179, 158], // #33b39e
}

// ---- minimal PNG encoder (8-bit RGBA, filter 0) ----
const CRC_TABLE = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c >>> 0
}
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4)
    raw[rowStart] = 0 // filter: none
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- tiny canvas (RGBA buffer) ----
function canvas(w, h) {
  const px = Buffer.alloc(w * h * 4)
  return {
    w, h, px,
    fill([r, g, b], x0 = 0, y0 = 0, x1 = w, y1 = h) {
      for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, Math.ceil(y1)); y++) {
        for (let x = Math.max(0, Math.floor(x0)); x < Math.min(w, Math.ceil(x1)); x++) {
          const i = (y * w + x) * 4
          px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255
        }
      }
    },
    rect(color, x0, y0, rw, rh, rad = 0) {
      for (let y = y0; y < y0 + rh; y++) {
        for (let x = x0; x < x0 + rw; x++) {
          if (rad > 0) {
            const cx = Math.min(Math.max(x, x0 + rad), x0 + rw - rad)
            const cy = Math.min(Math.max(y, y0 + rad), y0 + rh - rad)
            if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad) continue
          }
          this.fill(color, x, y, x + 1, y + 1)
        }
      }
    },
    blit(src, dx, dy) {
      for (let y = 0; y < src.h; y++) {
        for (let x = 0; x < src.w; x++) {
          const sx = x * 4, sy = y * src.w * 4
          const t = ((dy + y) * this.w + (dx + x)) * 4
          if (src.px[sy + 3] > 0) {
            this.px[t] = src.px[sx]; this.px[t + 1] = src.px[sx + 1]
            this.px[t + 2] = src.px[sx + 2]; this.px[t + 3] = 255
          }
        }
      }
    },
    toPNG() { return encodePNG(w, h, px) },
  }
}

// ---- the mark: stacked pack boxes on pine (mirrors icon.svg) ----
function drawMark(size) {
  const c = canvas(size, size)
  const s = size / 64
  c.fill(COLORS.paper)
  c.rect(COLORS.accent, 24 * s, 10 * s, 16 * s, 10 * s, 3 * s)         // top box
  c.rect(COLORS.accentDeep, 19 * s, 22 * s, 26 * s, 12 * s, 3 * s)     // middle box
  c.rect(COLORS.accentDeep, 14 * s, 34 * s, 36 * s, 16 * s, 3 * s)     // bottom box
  c.rect(COLORS.accent, 14 * s, 32 * s, 36 * s, 2 * s)                 // shelf line
  return c
}

function makeIcon(size) { return drawMark(size).toPNG() }

function makeOg() {
  const W = 1200, H = 630
  const c = canvas(W, H)
  c.fill(COLORS.paper)
  c.rect(COLORS.surface, 80, 105, 420, 420, 28)          // panel behind the mark
  const mark = drawMark(360)
  c.blit(mark, 110, 135)
  // bottom boxes echo: three accent ticks across the right side
  for (let i = 0; i < 3; i++) c.rect(COLORS.accent, 560 + i * 70, 480, 46, 10, 4)
  c.fill(COLORS.accent, 560, 300, 560 + 220, 302)        // mint rule under the wordless lockup area
  return c.toPNG()
}

writeFileSync(new URL('../public/favicon-32.png', import.meta.url), makeIcon(32))
writeFileSync(new URL('../public/icon-192.png', import.meta.url), makeIcon(192))
writeFileSync(new URL('../public/icon-512.png', import.meta.url), makeIcon(512))
writeFileSync(new URL('../public/apple-touch-icon.png', import.meta.url), makeIcon(180))
writeFileSync(new URL('../public/og-image.png', import.meta.url), makeOg())

console.log('icons written: favicon-32, icon-192, icon-512, apple-touch-icon, og-image')
