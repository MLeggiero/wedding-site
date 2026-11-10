/**
 * Ally & Mark: guest photo uploads, song requests and robot gift claims.
 *
 * Lives in a Google Sheet (Extensions → Apps Script). Photos are saved to a
 * private Drive folder and logged on the "Photos" tab; song requests go to the
 * "Songs" tab with a ready-made Spotify search link; "I'm getting this" taps in
 * the robot room go to the "RobotClaims" tab. Setup: apps-script/README.md
 */

const MAX_BYTES = 15 * 1024 * 1024;

function doGet(e) {
  // ?claims=1 → the item ids already claimed in the robot room (no names or emails)
  if (e && e.parameter && e.parameter.claims) return json({ ok: true, claimed: claimedIds() });
  return json({ ok: true, service: 'ally-and-mark-guests' });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.hp) return json({ ok: true }); // honeypot field filled → quietly ignore bots
    if (body.action === 'photo') return json(savePhoto(body));
    if (body.action === 'song') return json(saveSong(body));
    if (body.action === 'claim') return json(saveClaim(body));
    return json({ ok: false, error: 'Unknown request.' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function savePhoto(b) {
  const name = clean(b.name, 80);
  if (!name) throw new Error('Please add your name.');
  if (!b.data) throw new Error('No photo arrived. Please try again.');
  const bytes = Utilities.base64Decode(b.data);
  if (bytes.length > MAX_BYTES) throw new Error('That photo is too large.');
  const mime = /^image\/(jpeg|png|webp|heic|heif|gif)$/.test(b.mime) ? b.mime : 'image/jpeg';
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const stamp = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd HHmm');
  const folder = photoFolder();
  const file = folder.createFile(Utilities.newBlob(bytes, mime, stamp + ' ' + name + '.' + ext));
  file.setDescription([clean(b.who, 20), clean(b.note, 300)].filter(String).join(' · '));
  sheet('Photos', ['Time', 'Name', 'Email', 'Who is in it', 'Note', 'File']).appendRow(
    [new Date(), name, clean(b.email, 120), clean(b.who, 20), clean(b.note, 300), file.getUrl()].map(cell),
  );
  return { ok: true };
}

function saveSong(b) {
  const title = clean(b.title, 120);
  if (!title) throw new Error('Please add a song title.');
  const artist = clean(b.artist, 120);
  const search = 'https://open.spotify.com/search/' + encodeURIComponent([title, artist].filter(String).join(' '));
  sheet('Songs', ['Time', 'Name', 'Song', 'Artist', 'Note', 'Find on Spotify']).appendRow(
    [new Date(), clean(b.name, 80), title, artist, clean(b.note, 200), search].map(cell),
  );
  return { ok: true };
}

const CLAIMS_HEADER = ['Time', 'Robot', 'Item', 'Item id', 'Name', 'Email'];

function saveClaim(b) {
  const id = clean(b.item, 60);
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Unknown gift.');
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

// ---------- helpers
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
/**
 * The private Drive folder for guests' photos: the one named in the script
 * property PHOTO_FOLDER_ID if set, otherwise the folder called
 * "Wedding site: guest photos" (made on the first upload if it isn't there).
 */
const PHOTO_FOLDER_NAME = 'Wedding site: guest photos';
function photoFolder() {
  const id = PropertiesService.getScriptProperties().getProperty('PHOTO_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  const found = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return found.hasNext() ? found.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
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
