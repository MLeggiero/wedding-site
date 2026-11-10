# Ally & Mark: wedding website

Saturday, April 24, 2027 · State Botanical Garden of Georgia, Athens

**Live at https://mleggiero.github.io/wedding-site/**
Plan & design system: [`docs/PLAN.md`](docs/PLAN.md). House rules for design (style, native plants,
photos, and the grading rubric): [`CLAUDE.md`](CLAUDE.md).

## Go live (one time)

1. In this repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Open the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow** (or push any commit).
3. About two minutes later the site is at the address above. Every push to the default
   branch republishes it; a nightly run keeps the countdown fresh.

## Edit the site

Everything is plain text: edit on GitHub's web editor and commit, and the site rebuilds itself.

| What | Where |
|---|---|
| Names, date, venue, details password, contact email, photo credit | `src/config.ts` |
| Guest uploads & song requests endpoint, Spotify playlist link | `src/config.ts` (`guestEndpoint`, `spotifyPlaylistUrl`) |
| Our Story text | `src/content/chapters.yaml` |
| The Secret Registry's robots, kits, parts and prices | `src/content/robots/*.yaml` |
| Secret Registry chip-in handles (Venmo, PayPal) | `src/config.ts` (`venmoHandle`, `paypalHandle`) |
| FAQ | `src/content/faq.yaml` |
| Athens field guide | `src/content/places.yaml` |
| Charities | `src/content/charities.yaml` |
| Photo alt text and crop focus | `src/lib/photos.ts` |

List files show entries in id order, so keep the two-digit prefixes (`01-…`, `02-…`).
`[links](/travel/)`, `*italics*` and `**bold**` work in YAML text.

**Details password:** `detailsPassword` in `src/config.ts` (currently `greenhouse`; change it
before invitations go out). It's a courtesy prompt, not security; set it to `''` to remove it.

## Guest photos and song requests

Guests can send their favorite photo of you (**Share a photo**) and request songs (**Request a song**).
Both post to a small Google Apps Script web app that saves photos to a private Drive folder and logs
everything to a Google Sheet. Nothing lands in this repo. Until it's set up, both pages say
"Opening soon".

1. Follow the six steps in [`apps-script/README.md`](apps-script/README.md).
2. Paste the web-app URL into `guestEndpoint` in `src/config.ts`.
3. Optional: paste your Spotify playlist link into `spotifyPlaylistUrl` to show it on the Songs page.
   Requests arrive in the Sheet with a Spotify search link, ready to add.

## The Secret Registry

A secret page of robots and robot parts, set in a 3D conservatory drawn like the rest of the site.
The only way in is the little **duck** that waddles along the line at the foot of the Registry page
(or the direct link, `/secret-registry/`, for robot friends). It's unlisted and `noindex`.

- **The robots:** the makers' own 3D models of Microduck, Open Duck Mini v2 and the reBot Arm
  B601-DM, simplified for the web and moving on their real joints. The ducks walk the brick path
  and the arm repots a fern. Microduck can be steered (joystick on phones, arrow keys or WASD on a
  computer).
- **Model files:** `public/models/*.glb`, made by `npm run models -- <dir>` from clones of the three
  source repositories; credits and licences are in `public/models/LICENSES.md`.
- **Gift cards:** tapping a robot opens its card, with store links and prices from
  `src/content/robots/*.yaml`. The reBot Arm lists just its two kits (Body Motor Kit and Body
  Structure Kit).
- **Claims:** "I'm getting this" buttons appear once `guestEndpoint` is set; claims land in the
  Sheet's `RobotClaims` tab.
- **Chip-in:** Venmo and PayPal buttons appear once you fill in `venmoHandle` / `paypalHandle`.
- **Fallbacks:** with no WebGL the page shows the cards as a list; with reduced motion the scene
  holds still (and the duck stands still).

## QR codes

`print/` holds the save-the-date QR code (vector SVG, 2400px PNG, and a print PDF) pointing at
the home page. For invitations, make one that also unlocks the Details page:

```sh
npm run qr -- "https://mleggiero.github.io/wedding-site/details/?key=YOUR-PASSWORD" invitation
```

Don't rename this repo or the GitHub account once QR codes are printed.

## Run it locally

```sh
npm install
npm run dev       # http://localhost:4321/wedding-site/
npm run build     # static site in dist/
npm run check     # type check
```

## Photos

The site uses just four photos (#35, #20, #40, #62; see `docs/PLAN.md` §11 and the photo rules in
`CLAUDE.md`). Web-ready versions live in `src/assets/photos/`. To swap one, download the original
from Drive and run `npm run photos -- /path/to/originals` (originals are never committed).

## Look

Sage line engravings on ivory paper, like a letterpress invitation. Colours and type live in
`src/styles/global.css`: sage ink `#61746a` on paper `#efede6`, Corinthia for the script,
Cormorant Garamond for spaced capitals and italics, and EB Garamond for reading text.

## Plant art

The native plants are engraved in code: drawing tools and species (magnolia, dogwood, azalea,
Christmas fern, jessamine, maypop, trillium) in `src/lib/engrave.ts`, arrangements in
`src/lib/flora.ts` and `src/lib/hero-art.ts`, written to cached files under `/flora/*.svg` at
build time (`src/lib/art.ts`).

> RSVP answers and the guest list will live in a Google Sheet, never in this public repo.
