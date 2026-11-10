#!/usr/bin/env node
// Print-ready QR codes (SVG = vector for the printer, PNG = 2400px raster).
//
//   npm run qr                                   → save-the-date QR for the home page
//   npm run qr -- "https://mleggiero.github.io/wedding-site/details/?key=PASSWORD" invitation
//
// The invitation version can carry ?key=<password> so scanning it unlocks the
// Details & RSVP pages automatically.

import QRCode from 'qrcode';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.argv[2] ?? 'https://mleggiero.github.io/wedding-site/';
const name = process.argv[3] ?? 'save-the-date';

const variants = [
  { suffix: 'black', dark: '#000000', light: '#ffffff' }, // safest for print
  { suffix: 'green', dark: '#1e3a2b', light: '#00000000' }, // Conservatory Green, transparent background
];

await mkdir('print', { recursive: true });
for (const v of variants) {
  const opts = { errorCorrectionLevel: 'M', margin: 4, color: { dark: v.dark, light: v.light } };
  const base = `print/qr-${name}-${v.suffix}`;
  await writeFile(`${base}.svg`, await QRCode.toString(url, { ...opts, type: 'svg' }));
  await QRCode.toFile(`${base}.png`, url, { ...opts, width: 2400 });
  console.log(`${base}.svg / .png`);
}
console.log(`\nEncodes: ${url}`);
