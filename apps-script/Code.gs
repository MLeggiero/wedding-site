/**
 * Ally & Mark: guest photo uploads, song requests and robot gift claims.
 *
 * Lives in a Google Sheet (Extensions → Apps Script). Photos are saved to a
 * private Drive folder and logged on the "Photos" tab; song requests go to the
 * "Songs" tab with a ready-made Spotify search link; "I'm getting this" taps in
 * the robot room go to the "RobotClaims" tab. Setup: apps-script/README.md
 *
 * Least privilege: appsscript.json limits the script to this one Sheet
 * (spreadsheets.currentonly) and to Drive files it made itself (drive.file),
 * so it can't see or change anything else in your Drive. Visitors can only
 * do the four things below; nothing they send picks a file or folder.
 */

const MAX_BYTES = 10 * 1024 * 1024; // one photo (the site shrinks photos to about 1 to 3 MB)
const MAX_TOTAL = 3 * 1024 * 1024 * 1024; // all guest photos together
const MAX_PER_MINUTE = 40; // requests of any kind, from everyone together
const PHOTO_FOLDER_NAME = 'Wedding site: guest photos';
const IMAGE_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic' };
const PHOTOS_HEADER = ['Time', 'Name', 'Email', 'Who is in it', 'Note', 'File'];
const SONGS_HEADER = ['Time', 'Name', 'Song', 'Artist', 'Note', 'Find on Spotify'];
const CLAIMS_HEADER = ['Time', 'Robot', 'Item', 'Item id', 'Name', 'Email'];

function doGet(e) {
  // ?claims=1 → the item ids already claimed in the robot room (no names or emails)
  if (e && e.parameter && e.parameter.claims) return json({ ok: true, claimed: claimedIds() });
  return json({ ok: true, service: 'ally-and-mark-guests' });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.hp) return json({ ok: true }); // honeypot field filled → quietly ignore bots
    throttle();
    if (body.action === 'photo') return json(savePhoto(body));
    if (body.action === 'song') return json(saveSong(body));
    if (body.action === 'claim') return json(saveClaim(body));
    return json({ ok: false, error: 'Unknown request.' });
  } catch (err) {
    if (err && err.forGuest) return json({ ok: false, error: err.message });
    console.error(err);
    return json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
}

function savePhoto(b) {
  const name = clean(b.name, 80);
  if (!name) throw guestError('Please add your name.');
  if (typeof b.data !== 'string' || !b.data) throw guestError('No photo arrived. Please try again.');
  if (b.data.length > Math.ceil(MAX_BYTES / 3) * 4) throw guestError('That photo is too large.');
  const bytes = Utilities.base64Decode(b.data);
  if (bytes.length > MAX_BYTES) throw guestError('That photo is too large.');
  const type = imageType(bytes);
  if (!type) throw guestError('That file doesn’t look like a photo.');
  const folderId = photoFolderId();
  reserveSpace(bytes.length);
  const stamp = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd HHmm');
  const file = Drive.Files.create(
    {
      name: stamp + ' ' + name.replace(/[\\/:*?"<>|]/g, ' ') + '.' + IMAGE_EXT[type],
      parents: [folderId],
      description: [clean(b.who, 20), clean(b.note, 300)].filter(String).join(' · '),
    },
    Utilities.newBlob(bytes, type),
    { fields: 'id,webViewLink' },
  );
  sheet('Photos', PHOTOS_HEADER).appendRow(
    [new Date(), name, clean(b.email, 120), clean(b.who, 20), clean(b.note, 300), file.webViewLink].map(cell),
  );
  return { ok: true };
}

function saveSong(b) {
  const title = clean(b.title, 120);
  if (!title) throw guestError('Please add a song title.');
  const artist = clean(b.artist, 120);
  const search = 'https://open.spotify.com/search/' + encodeURIComponent([title, artist].filter(String).join(' '));
  sheet('Songs', SONGS_HEADER).appendRow([new Date(), clean(b.name, 80), title, artist, clean(b.note, 200), search].map(cell));
  return { ok: true };
}

function saveClaim(b) {
  const id = clean(b.item, 60);
  if (!/^[a-z0-9-]+$/.test(id)) throw guestError('Unknown gift.');
  sheet('RobotClaims', CLAIMS_HEADER).appendRow(
    [new Date(), clean(b.robot, 60), clean(b.label, 120), id, clean(b.name, 80), clean(b.email, 120)].map(cell),
  );
  return { ok: true };
}

/** Delete a row on the RobotClaims tab to un-claim a gift. */
function claimedIds() {
  const sh = sheet('RobotClaims', CLAIMS_HEADER);
  if (sh.getLastRow() < 2) return [];
  const ids = sh.getRange(2, 4, sh.getLastRow() - 1, 1).getValues().map((r) => String(r[0]));
  return ids.filter((v, i) => v && ids.indexOf(v) === i);
}

// ---------- limits
/** At most MAX_PER_MINUTE requests a minute, from everyone together. */
function throttle() {
  const cache = CacheService.getScriptCache();
  const key = 'requests-' + Math.floor(Date.now() / 60000);
  withLock(() => {
    const n = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(n), 120);
    if (n > MAX_PER_MINUTE) throw guestError('Lots of people are sending things right now. Please try again in a minute.');
  });
}

/** Keep a running total of photo storage and stop at MAX_TOTAL. */
function reserveSpace(n) {
  withLock(() => {
    const props = PropertiesService.getScriptProperties();
    const used = Number(props.getProperty('PHOTO_BYTES') || 0);
    if (used + n > MAX_TOTAL) throw guestError('Photo uploads are full for now. Thank you!');
    props.setProperty('PHOTO_BYTES', String(used + n));
  });
}

/** The real type of an image, from its first bytes (not from what the sender claims). */
function imageType(bytes) {
  const b = (i) => (i < bytes.length ? bytes[i] & 0xff : -1);
  const ascii = (from, text) => text.split('').every((c, i) => b(from + i) === c.charCodeAt(0));
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg';
  if (b(0) === 0x89 && ascii(1, 'PNG')) return 'image/png';
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  if (ascii(0, 'GIF8')) return 'image/gif';
  if (ascii(4, 'ftyp') && ['heic', 'heix', 'heif', 'mif1', 'msf1'].some((t) => ascii(8, t))) return 'image/heic';
  return '';
}

// ---------- helpers
/**
 * The private folder for guests' photos, made by this script on the first
 * upload (with drive.file, the script can only use folders it made itself).
 */
function photoFolderId() {
  const props = PropertiesService.getScriptProperties();
  const known = props.getProperty('PHOTO_FOLDER_ID');
  if (known) return known;
  return withLock(() => {
    let id = props.getProperty('PHOTO_FOLDER_ID');
    if (!id) {
      id = Drive.Files.create({ name: PHOTO_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }).id;
      props.setProperty('PHOTO_FOLDER_ID', id);
    }
    return id;
  });
}
function sheet(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}
function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
/** An error whose message is safe and useful to show the guest. */
function guestError(message) {
  const err = new Error(message);
  err.forGuest = true;
  return err;
}
function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}
/** Stop guest text from being read as a spreadsheet formula. */
function cell(v) {
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
