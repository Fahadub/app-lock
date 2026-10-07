// Generates app icons (icon.png, adaptive foreground/background) as pure PNGs
// using only Node built-ins. No external dependencies.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
mkdirSync(assets, { recursive: true });

// ---------- minimal PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crcInput = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  out.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return out;
}

function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- drawing ----------
const hexColor = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const BG_TOP = hexColor('#0D1430');
const BG_BOT = hexColor('#223C7B');
const WHITE = [234, 240, 255];

function bgAt(t) {
  return [
    Math.round(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t),
    Math.round(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t),
    Math.round(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t),
  ];
}

function inRoundRect(px, py, x0, y0, x1, y1, r) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const cx = Math.min(Math.max(px, x0 + r), x1 - r);
  const cy = Math.min(Math.max(py, y0 + r), y1 - r);
  const dx = px - cx;
  const dy = py - cy;
  if (dx <= 0 || dy <= 0) return true;
  return dx * dx + dy * dy <= r * r;
}

// Returns 0 (empty), 1 (lock body / white), 2 (keyhole).
// Coordinates are in a 1024x1024 space, scaled around (cx, cy).
function lockAt(px, py, cx, cy, s) {
  const X = v => cx + (v - 512) * s;
  const Y = v => cy + (v - 512) * s;
  const body = inRoundRect(px, py, X(322), Y(496), X(702), Y(792), 70 * s);
  const shackleOuter = inRoundRect(px, py, X(392), Y(268), X(632), Y(566), 88 * s);
  const shackleInner = inRoundRect(px, py, X(462), Y(338), X(562), Y(566), 40 * s);
  const holeCircle = (px - X(512)) ** 2 + (py - Y(614)) ** 2 <= (40 * s) ** 2;
  const holeStem = inRoundRect(px, py, X(496), Y(614), X(528), Y(700), 14 * s);
  if (body) return holeCircle || holeStem ? 2 : 1;
  if (shackleOuter && !shackleInner) return 1;
  return 0;
}

// Supersampled renderer: SS x SS samples per output pixel.
function render(size, ss, sample) {
  const buf = Buffer.alloc(size * size * 4);
  const inv = 1 / (ss * ss);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < ss; dy++) {
        for (let dx = 0; dx < ss; dx++) {
          const [cr, cg, cb, ca] = sample((x * ss + dx + 0.5) / ss, (y * ss + dy + 0.5) / ss);
          r += cr * ca; g += cg * ca; b += cb * ca; a += ca;
        }
      }
      const o = (y * size + x) * 4;
      if (a > 0) {
        buf[o] = r / a;
        buf[o + 1] = g / a;
        buf[o + 2] = b / a;
      }
      buf[o + 3] = a * inv;
    }
  }
  return encodePNG(size, size, buf);
}

const S = 1024;

// Main icon: gradient background + white padlock (keyhole shows the gradient).
const icon = render(S, 2, (x, y) => {
  const part = lockAt(x, y, 512, 540, 1);
  if (part === 1) return [...WHITE, 255];
  return [...bgAt(y / S), 255];
});
writeFileSync(join(assets, 'icon.png'), icon);

// Adaptive foreground: transparent background, lock scaled into the safe zone.
const adaptiveFg = render(S, 2, (x, y) => {
  const part = lockAt(x, y, 512, 512, 0.62);
  return part === 1 ? [...WHITE, 255] : [0, 0, 0, 0];
});
writeFileSync(join(assets, 'adaptive-foreground.png'), adaptiveFg);

// Adaptive background: plain gradient.
const adaptiveBg = render(S, 1, (x, y) => [...bgAt(y / S), 255]);
writeFileSync(join(assets, 'adaptive-background.png'), adaptiveBg);

console.log('icons written to', assets);
