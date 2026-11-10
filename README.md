# Ally & Mark — wedding website

Saturday, April 24, 2027 · State Botanical Garden of Georgia, Athens

**Live at https://mleggiero.github.io/wedding-site/** (once GitHub Pages is switched on — see below).
Plan & design system: [`docs/PLAN.md`](docs/PLAN.md).

## Go live (one time)

1. In this repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Open the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow** (or push any commit).
3. About two minutes later the site is at the address above. Every push to the default
   branch republishes it; a nightly run keeps the countdown fresh.

## Edit the site

Everything is plain text — edit on GitHub's web editor and commit; the site rebuilds itself.

| What | Where |
|---|---|
| Names, date, venue, details password, contact email, photo credit | `src/config.ts` |
| Our Story text and proposal captions | `src/content/chapters.yaml`, `src/content/proposal.yaml` |
| FAQ | `src/content/faq.yaml` |
| Athens field guide | `src/content/places.yaml` |
| Charities | `src/content/charities.yaml` |
| Photo alt text and crop focus | `src/lib/photos.ts` |

List files show entries in id order, so keep the two-digit prefixes (`01-…`, `02-…`).
`[links](/travel/)`, `*italics*` and `**bold**` work in YAML text.

**Details password:** `detailsPassword` in `src/config.ts` (currently `greenhouse` — change it
before invitations go out). It's a courtesy prompt, not security; set it to `''` to remove it.

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

Web-ready versions live in `src/assets/photos/`. To add more, download originals from Drive
into a folder and run `npm run photos -- /path/to/originals` (originals are never committed).

> RSVP answers and the guest list will live in a Google Sheet, never in this public repo.
