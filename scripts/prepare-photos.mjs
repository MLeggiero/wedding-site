#!/usr/bin/env node
// Turn full-size engagement-photo originals into web-ready masters.
//
//   npm run photos -- /path/to/originals
//
// Originals (10–26 MB each) stay in Google Drive / on your computer; only the
// 2400px masters are committed. Astro then makes the responsive sizes at build.
// Files must be named like the Drive exports: "Mark&Ally - ColorGraded-16.jpg"
// or already-renamed "colorgraded-16.jpg".

import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const srcDir = process.argv[2] ?? 'originals';
const outDir = 'src/assets/photos';
const LONG_EDGE = 2400;

// Social-share card (texted links show this): photo + crop focus (0–1).
const OG = { photo: '16', focusX: 0.52, focusY: 0.42 };

await mkdir(outDir, { recursive: true });
const files = (await readdir(srcDir)).filter((f) => /\.jpe?g$/i.test(f));
if (!files.length) {
  console.error(`No JPEGs found in ${srcDir}`);
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const num = file.match(/(\d{2})\.jpe?g$/i)?.[1];
  if (!num) continue;
  const out = path.join(outDir, `colorgraded-${num}.jpg`);
  await sharp(path.join(srcDir, file))
    .rotate() // respect camera orientation, then metadata is dropped
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(out);
  const { size } = await stat(out);
  total += size;
  console.log(`${out}  ${(size / 1024).toFixed(0)} KB`);
}
console.log(`\n${files.length} photos → ${(total / 1024 / 1024).toFixed(1)} MB`);

// Open Graph image (1200×630), cropped around the chosen focus point.
const ogSrc = path.join(outDir, `colorgraded-${OG.photo}.jpg`);
const meta = await sharp(ogSrc).metadata();
const scale = Math.max(1200 / meta.width, 630 / meta.height);
const w = Math.round(meta.width * scale);
const h = Math.round(meta.height * scale);
const left = Math.min(Math.max(Math.round(w * OG.focusX - 600), 0), w - 1200);
const top = Math.min(Math.max(Math.round(h * OG.focusY - 315), 0), h - 630);
await sharp(ogSrc)
  .resize(w, h)
  .extract({ left, top, width: 1200, height: 630 })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og.jpg');
console.log('public/og.jpg  1200×630');
