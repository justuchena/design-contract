/**
 * Enough PNG to compare two screenshots, and no more.
 *
 * Reading a pixel needs a decoder, and the usual answer is a dependency.
 * This repo's answer is twelve lines over a version table wherever that
 * trade is available, and here it is: `zlib` is built into Node, and the
 * subset a screenshot actually uses — 8-bit, non-interlaced, greyscale or
 * truecolour with or without alpha — is one inflate and five filter cases.
 *
 * What it refuses is as important. 16-bit samples, a palette and Adam7
 * interlacing are all legal PNG and none of them come out of a browser
 * screenshot, so each one throws by name instead of being half-handled.
 * A decoder that silently mangles an unexpected format would report a
 * visual change that is not there, which is the one thing a gate must
 * never do.
 */
import { inflateSync, deflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

/* The table-driven CRC-32 the format specifies. Needed to write a chunk; on
   read it is skipped, because a corrupt screenshot is not a failure mode
   worth a second pass over every byte. */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

/** Decode to `{ width, height, pixels }`, pixels being RGBA, four bytes each. */
export const decode = (buf) => {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");

  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  const idat = [];

  for (let at = 8; at + 8 <= buf.length; ) {
    const length = buf.readUInt32BE(at);
    const type = buf.toString("ascii", at + 4, at + 8);
    const body = buf.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colorType = body[9];
      if (body[12] !== 0) throw new Error("interlaced PNG is not supported");
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    at += 12 + length;
  }

  if (depth !== 8) throw new Error(`${depth}-bit samples are not supported`);
  const channels = CHANNELS[colorType];
  if (!channels) throw new Error(`colour type ${colorType} is not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  /* The previous *unfiltered* row, which is what the filters refer back to.
     Keeping the filtered bytes here instead is the classic way to get a
     picture that looks almost right. */
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const at = y * (stride + 1);
    const filter = raw[at];
    const row = Buffer.from(raw.subarray(at + 1, at + 1 + stride));

    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? row[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      if (filter === 1) row[i] = (row[i] + a) & 0xff;
      else if (filter === 2) row[i] = (row[i] + b) & 0xff;
      else if (filter === 3) row[i] = (row[i] + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        row[i] = (row[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      } else if (filter !== 0) throw new Error(`unknown row filter ${filter}`);
    }

    for (let x = 0; x < width; x += 1) {
      const s = x * channels;
      const d = (y * width + x) * 4;
      if (channels === 1) {
        pixels[d] = pixels[d + 1] = pixels[d + 2] = row[s];
        pixels[d + 3] = 255;
      } else if (channels === 2) {
        pixels[d] = pixels[d + 1] = pixels[d + 2] = row[s];
        pixels[d + 3] = row[s + 1];
      } else {
        pixels[d] = row[s];
        pixels[d + 1] = row[s + 1];
        pixels[d + 2] = row[s + 2];
        pixels[d + 3] = channels === 4 ? row[s + 3] : 255;
      }
    }
    prev = row;
  }

  return { width, height, pixels };
};

/** Encode RGBA back to a PNG, filter 0 throughout. */
export const encode = ({ width, height, pixels }) => {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunk = (type, body) => {
    const out = Buffer.alloc(body.length + 12);
    out.writeUInt32BE(body.length, 0);
    out.write(type, 4, "ascii");
    body.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};
