# Ally & Mark: Wedding Website Plan

**"The Glasshouse"** · Saturday, April 24, 2027 · State Botanical Garden of Georgia, Athens

> Status: plan, written 2026-11-10, with every decision below confirmed in Q&A. Updated the same day to simplify security.
> **v1 built (2026-11-10):** Home, Our Story, Travel (with field guide), Registry teaser, FAQ, Details (courtesy-password placeholder) and 404, plus save-the-date QR files in `print/`. See the v1 checklist in §15.
> **Direction revised (2026-11-10, from your feedback):** cozy *maximalist* Southern conservatory, plants native to the southeastern US only, four photos in all, short copy, fancier type. Guests can now send a favorite photo and request songs. §3 describes the new design system; the house rules (and the 100-point rubric every design must clear) live in `CLAUDE.md`. Every page now uses it.
> **Robot room built (2026-11-10):** After Hours is live behind a brass duck on the Registry page (your request: that's the only way in). Built as stylized three.js portraits with a steerable Microduck. The official meshes and the live MuJoCo duck remain follow-ups; see §10.6.
> A **GitHub Pages** site published straight from this repo. Security isn't a goal (it's a wedding website). Everything lives here except RSVP answers and the guest list, which stay in a Google Sheet.

---

## 1. Decisions at a glance

| Area | Decision |
|---|---|
| Concept | **Cozy maximalist Southern conservatory** (revised from the original airy Victorian glasshouse): evergreen trellis walls by candlelight, gilt frames, oxblood plates, and southeastern native plants spilling over everything |
| Photos | **Four in all:** #35 (home hero, deep-pink blossoms), #20 (the ring), #40 (ring hand on his chest, cropped waist-up), #62 (the stone bridge) |
| Guest features | **Share a photo** (to a private Google Drive folder) and **Request a song** (logged to a Google Sheet; the Spotify playlist is shown on the page). Both go through one Apps Script web app (`apps-script/`). |
| Names | **Ally & Mark**, with an **A & M** monogram |
| Address | `https://mleggiero.github.io/wedding-site/`, shared as a link and a QR code |
| Hosting | **GitHub Pages**, published from this repo by GitHub's standard Pages workflow on every push |
| Framework | Astro (static output) with two small React islands |
| Privacy | Simple, not secure. **Public:** home, story, photos, travel and field guide, FAQ, registry. **Behind a courtesy password prompt:** schedule, garden map and parking, hotel-block details, RSVP |
| Password mechanism | A browser-side prompt, not encryption. The invitation QR unlocks it automatically, and one setting turns it off. |
| RSVP | Custom form → Google Apps Script → Google Sheet |
| Items and cash funds | **Zola** is the system of record: items from any store, plus cash funds with the 2.5% fee absorbed by us. The site shows a themed gallery that links out to Zola. |
| Charities | Every.org donate pop-up on our own page, for **Kiwimbi International** and **Chattahoochee Riverkeeper** |
| Extra feature | Athens field guide and illustrated garden map |
| Secret page | **"After Hours"** (§10), a 3D night glasshouse that doubles as a robot registry:<br>• **Door:** a brass duck hidden in the footer<br>• **Residents:** Microduck, Open Duck Mini v2, and the reBot Arm B601-DM with its leader arm<br>• **Motion:** animated robots, plus a live-physics Microduck you can steer<br>• **Gifts:** store links with an "I'm getting this" claim, plus Venmo/PayPal chip-in |
| Editing | Markdown/YAML files in this repo. Edits made in GitHub's web editor publish automatically. |
| Timeline | The QR code exists on day 1; v1 goes live within ~2 weeks so save-the-dates can go out |

## 2. Goals and principles

1. **It should feel like stepping into a sunlit Victorian glasshouse:** classy, never kitschy.
2. **Phone-first and kind to older guests:** 18px+ body text, 44px tap targets, and no gate in front of public pages.
3. **Fast.** Public pages ship almost no JavaScript, and the 3D room only loads when someone opens it.
4. **Simple over secure.** It's a wedding website. Everything lives in this repo; only RSVP answers and the guest list live in a Google Sheet.
5. **Low maintenance:** YAML/Markdown content, no servers to babysit, and one nightly rebuild.

---

## 3. Design system: "The Glasshouse"

### 3.1 Mood

A Southern conservatory after dark: evergreen trellis walls lit by candlelight, gilded frames, fireflies, and plants native to the Southeast spilling over every edge, from magnolia and dogwood to azaleas, jessamine, ferns and Spanish moss. Maximalist and cozy, never minimal or cold. The couple's rules (style, photos, the grading rubric) are in `CLAUDE.md`.

### 3.2 Palette

| Role | Hex |
|---|---|
| Evergreen wall | `#18301F` (trellis laths `#22432C`) |
| Gold leaf | gradient `#7A5416 → #F7E3A1 → #8A6119`; flat gold `#D9AB4E` |
| Amber (eyebrows, notes) | `#E0A84F` |
| Cream text on dark | `#F3E8CF`; italic leads `#EAD9B4` |
| Card stock | `#F8EFDC → #F1E3C4` |
| Oxblood plate | `#8A2D40 → #5E1A29` with a double gold ring |
| Ink on card | `#1D2A20`; labels `#18301F`; "optional" `#6B4A2E` |
| Flower accents | azalea pink, flame orange, honeysuckle red, jessamine yellow, maypop lavender |

**Measured WCAG contrast:**

| Pairing | Contrast |
|---|---|
| Cream on evergreen | 11.6:1 |
| Leads on evergreen | 10.2:1 |
| Amber / gold on evergreen | 6.7:1 |
| Ink on card | 11.8:1 |
| Labels on card | 11.2:1 |
| "optional" on card | 6.2:1 |
| Button text on oxblood | 7.2–11.0:1 |
| Focus ring (oxblood) on card | 7.7:1 |
| Input borders on card | 3.1:1 (non-text, ≥ 3:1) |

### 3.3 Typography

All self-hosted through Fontsource (OFL), so the site makes no Google Fonts requests.

- **Names and titles:** Ballet, a formal script, in gold leaf.
- **Dates and headings:** Playfair Display (variable).
- **Eyebrows, labels and buttons:** IM Fell English SC.
- **Body, leads and inputs:** EB Garamond (variable), with italics for leads.
- Pages not yet restyled still use the original Cormorant Garamond and Source Sans 3.

### 3.4 Motifs and components

| Component | What it is |
|---|---|
| `CozyRoom` | The dark conservatory wall: trellis wallpaper, candle glow, a double gilt border with corner scrolls, fireflies, and optional native plants (corner swags and beds, plus climbing side vines on wide screens) |
| `HeroFrame` | A gilded arch around the hero photo, wreathed in magnolia, ferns and blossoms |
| `GiltCard` | Cream card stock in a double gilt frame, with a native sprig over each corner; holds forms |
| `RoomHeading` | Small-caps eyebrow, gilded script title, gold flourish, one italic line |
| `Flora` | Places one plant drawing as an image |
| `.btn-plate` | The oxblood plate button with a double gold ring |
| `Flourish` | Gold scrollwork with a dogwood at its heart |

**Botanical art** is drawn in code, so it's crisp at any size and recolors easily:

- `src/lib/natives.ts`: the plants
- `src/lib/flora.ts` and `src/lib/hero-art.ts`: the arrangements
- At build time, `src/lib/art.ts` writes each arrangement to a cached file in `/flora/*.svg`, so pages stay small and the plants load once for the whole site.

Every plant is native to the southeastern US:

- **Flowers and shrubs:** Southern magnolia, flowering dogwood, Piedmont and flame azaleas, eastern redbud, Sweet Betsy trillium.
- **Vines:** Carolina jessamine, coral honeysuckle, maypop.
- **Ferns:** Christmas, maidenhair and cinnamon ferns.
- **Moss:** Spanish moss.
- **Butterfly:** the eastern tiger swallowtail, Georgia's state butterfly.
- **No tropicals.**

### 3.5 Motion

- Fireflies twinkle softly in the conservatory rooms.
- Astro view transitions give a quick cross-fade between pages.
- Reveal-on-scroll is a fade plus an 8px rise, 300ms or less.
- Parallax uses CSS scroll-driven animations where supported and stays static elsewhere.
- `prefers-reduced-motion` turns all of it off.

### 3.6 Voice

Warm and brief. **Few words:** a line, not a paragraph. For example: "Join in." · "What gets you on the dance floor?" · "Formal invitation to follow."

---

## 4. Site map

```
/wedding-site/
├── /                   Home ...................................... public
├── /our-story/         The proposal + blossom gallery ............ public
├── /travel/            Getting here · stay · field guide + map ... public
├── /registry/          Gifts · funds · giving back ............... public
├── /faq/               Questions ................................. public
├── /share-a-photo/     Send us your favorite photo of us ......... public
├── /songs/             Request a song · our playlist ............. public
├── /details/           The Day (schedule) ........................ 🔒 password
│   ├── /details/map/   Garden map · parking · accessible route ... 🔒
│   ├── /details/stay/  Hotel-block codes · shuttle ............... 🔒
│   └── /details/rsvp/  RSVP ...................................... 🔒
├── /after-hours/       Secret robot glasshouse ................... unlisted · noindex
└── 404                 "You've wandered off the path"
```

Navigation: **Home · Our Story · Travel · Registry · FAQ · 🔒 Details & RSVP**. The two guest pages are linked from the footer and the home page's "Join in" band.

On phones the menu opens as a full-screen frosted "glass door".

## 5. Pages

### Home

- **Hero** (a `CozyRoom`):
  - "Save the date", then *Ally & Mark* in gilded script.
  - SATURDAY · APRIL 24 · 2027, the venue in italics.
  - Photo #35 in the gilded, plant-wreathed `HeroFrame`.
  - An oxblood plate counting the days until "I do", and "Formal invitation to follow".
- **Cards:** Our Story (#20), Travel (#62), Registry (#40).
- **Join in:** a small conservatory band with two plate buttons, **Share a photo** and **Request a song**.

### Share a photo (public)

A gilt card with a short form:

- **Fields:** name, optional email, who's in it (both of us · Ally · Mark), the photo, and an optional note.
- **On the phone:** photos shrink to about 2400 px before sending.
- **Where it goes:** the private Drive folder, with a row in the "Photos" tab of the Sheet.

### Request a song (public)

- **Fields:** song, artist, and optionally your name and a note.
- **Where requests go:** the "Songs" tab of the Sheet, each with a ready-made Spotify search link.
- **The playlist:** embedded under the form once `spotifyPlaylistUrl` is set in `src/config.ts`.
- **Why there's no auto-add:** Spotify's API now needs the app owner to have Premium and caps unreviewed apps at 5 users.

Both forms say **"Opening soon"** until `guestEndpoint` is set (setup: `apps-script/README.md`).

### Our Story

Short by design: the ring photo (#20) in a gilt arch, one line, and links on to Travel and the Registry. "How we met" waits for your words.

### Travel (public)

- **Getting here:**
  - Most guests will fly into ATL, about 1.5 hours away by car.
  - Parking at the garden is free.
- **Where to stay:** hotel cards are public; block codes and booking links sit behind the password.
- **Getting around:** rideshare notes and late-night pickup tips.
- **Weather:** late April usually brings highs in the 70s °F and cool evenings, so "bring a layer". Verify closer to the date.
- **Field guide and illustrated map:** see §8.
- **Hotel timing:**
  - Athens Twilight 2027 is Saturday, April 17, the weekend *before*, so it doesn't conflict.
  - Still reserve blocks early, and check UGA's spring calendar for April 23–25.

### Registry (public)

See §9.

### FAQ (public, general only)

- Dress code
- Children and plus-ones (general wording)
- Accessibility: an elevator from parking and golf-cart assistance on request (confirm with the venue)
- Indoors or out
- Unplugged ceremony
- Gifts
- Contact

Anything venue-specific goes under `/details/`.

### Details (🔒)

- **The Day:** a timeline built from `PlantTag`s.
- **Garden map:** parking and the accessible route.
- **Stay:** hotel blocks and shuttle.
- **Day-of contact.**
- **RSVP call to action.**

### 404

A playful photo (ColorGraded-07) and the line "You've wandered off the path." with a link home.

---

## 6. The details password (a courtesy, not security)

It's a wedding website, so the goal is convenience, not secrecy. Everything, the details included, lives in this public repo.

- **How it works.** The Details and RSVP pages open with a friendly glasshouse-door prompt: "The password is on your invitation."
  - The check happens in the browser and simply reveals the page.
  - It keeps casual visitors out of the schedule. Anyone who views the page source can still read it, and that's fine.
- **Typed once.** After the first correct entry, the browser remembers it.
- **The QR unlocks it.** The invitation QR points to `…/details/?key=<password>`, which unlocks and remembers in one step. The password is also printed for anyone typing the address.
- **One setting.** `detailsPassword` lives in `src/config.ts`. Set it to an empty string and the prompt disappears.
- **Kept out of Google.** A `noindex` tag on every page keeps the site out of search results. It's one line.
- **The one thing not in the repo: your guest list.** It stays in the Google Sheet, and the RSVP lookup returns only the household that was searched for. This isn't about security; it just avoids publishing everyone's names, at no extra cost.

**Behind the prompt:** schedule, garden map, hotel-block codes, RSVP. **Public:** everything else.

---

## 7. RSVP

### Guest flow

Mobile-first, about a minute:

1. **Find your invitation.** Type your name. The match is fuzzy and tolerates nicknames.
2. **Your party.** Mark each invited person as attending or not. Name your plus-one if one is allowed; add children if they're invited.
3. **Dietary needs.** Dinner is a buffet, so we only ask per person for vegetarian, vegan or allergies. These feed the caterer's special-meal count.
4. **Extras.** A song request, a note to the couple, and an email for the confirmation.
5. **Done.** A pressed-flower confirmation screen and an email receipt. Guests can look themselves up again to edit until the deadline.

### Data

A new Google Sheet, **"Wedding RSVPs"**, owned by one of you and shared with the other:

| Tab | Columns |
|---|---|
| `Households` | household_id, invitation name, email, plus-one allowed, children allowed, notes |
| `Guests` | guest_id, household_id, first, last, type (adult / plus-one / child) |
| `Responses` | Append-only log: timestamp, guest_id, attending, dietary, plus-one name, song, note |
| `Summary` | Live counts: yes / no / pending, vegetarian / vegan / allergies, children. Ready to send to the caterer. |
| `RobotClaims` | Robot-room claims: item id, time, optional name and email (§10.5) |
| `Thank-yous` | Merged gift log (§9, §10) |

Households and Guests are imported once from the existing guest list after it's final.

### Backend

A Google Apps Script web app attached to that Sheet. It's free and needs no server. The source lives in `apps-script/`; deploy it with `clasp` or paste it into the Apps Script editor.

- **Endpoints:**
  - `doGet`: looks up a name and returns that household.
  - `doPost`: saves the answers, with a lock so simultaneous RSVPs don't collide, then sends a confirmation email.
- **Spam:** a hidden honeypot field keeps bots out.
- **Deadline:** a Script Property you can change anytime.
- **Endpoint URL:** lives in `src/config.ts`. It's fine for it to be public.
- **Talking to GitHub Pages:** requests go out as `text/plain`, so Apps Script accepts them without CORS trouble.
- **Email sender:** confirmation emails come from whichever of you deploys the script.
- **Fallback:** a "Having trouble? Email us" link is always visible.

---

## 8. Athens field guide and garden map

- **`places.yaml`.** Each place has:
  - name
  - category: Coffee, Eat, Drink, Wander, Music or Shop
  - a one-line note in your voice
  - neighborhood
  - Apple/Google Maps link
  - pin position

  Ideas to pre-seed for you to edit: the UGA Arch (cast-iron Victorian ironwork, a nice tie-in), North Campus, the Georgia Theatre rooftop, the 40 Watt, and a Saturday-morning farmers market. Verify the market's season start.
- **Illustrated Athens map.** An SVG in the house style showing downtown, UGA, and the route down S. Milledge Ave to the Garden. Numbered pins stay in sync with the list.
  - No map API and no API keys.
  - Fast and private.
  - "Open in Maps" handles navigation.
- **Garden map (🔒).** Our own stylized schematic, drawn from scratch rather than copied from the garden's map, and verified with the venue coordinator. It shows:
  - parking → entry plaza and elevator → the Conservatory
  - the ceremony and cocktail-hour spots
  - the accessible route
  - restrooms

---

## 9. Registry ("Gifts")

### Page order, top to bottom

1. **A short note:** "Your presence is the gift…"
2. **Funds (Zola cash funds),** e.g. Honeymoon, First home and garden, Date nights.
   - Each `FundCard` has an illustration, a short story, suggested amounts and a **Give via Zola** button.
   - An optional growth meter shows plant stages (seed → sprout → bloom), updated by hand. No dollar figures unless you want them.
   - We cover Zola's 2.5% card fee (a Zola setting), so guests see a normal checkout.
   - Venmo is the $0 option inside Zola.
3. **The Collection (Zola items from any store).** 8–16 curated highlights with our own photos and copy, each linking to Zola, followed by "See the full registry on Zola →". Zola handles four things:
   - **Duplicates:** an item is "On Hold" until the purchase is confirmed.
   - **Shipping:** your address stays private.
   - **Group gifts** for big items.
   - **The 20% completion discount** after the wedding.
4. **Give back (Every.org)** for **Kiwimbi International** (EIN 45-3670761) and **Chattahoochee Riverkeeper** (EIN 58-2095413).
   - Every.org's donate button opens a pop-up *on our page*.
   - There is no platform fee, gifts are tax-deductible, and guests can leave a note.
   - Each charity gets one "in honor of Ally & Mark" fundraiser. Totals come from Every.org's API at build time and refresh in the nightly rebuild.
5. **Thank-you tracking.** Zola's gift-tracker CSV and Every.org's contributor list are merged into the Sheet's `Thank-yous` tab.

### Data and maintenance

- `src/content/registry/{funds,items,charities}.yaml` are schema-validated, so a typo fails the build instead of breaking the page.
- A weekly link check (lychee) covers every outbound registry and robot link and opens a GitHub issue if one breaks.

### Ruled out

| Option | Why |
|---|---|
| Self-hosted Stripe fund | Stripe's terms prohibit personal gift payments. |
| Embedding Zola | No embed exists. |
| Venmo for charity money | Venmo's terms bar it. |
| Robot gifts on Zola | Zola registries are public, which would give away the secret room. They live in §10 instead. |

---

## 10. Secret page: the robot glasshouse

### 10.1 Concept: "After Hours"

The same Victorian glasshouse, at night:
- moonlight through the glazing
- lanterns and string lights
- fireflies drifting between the palms

Once the guests have gone home, the robots have the run of the place. Every robot doubles as a registry card.

### 10.2 The secret door

- **The duck.** A tiny **brass duck figurine** hides in the flower bed at the bottom of the **Registry (Gifts) page**, and nowhere else.
  - On hover or focus it waddles.
  - Clicking it opens `/after-hours/`.
- **Accessible.** The duck is a real link with a playful label ("A small brass duck. What's it doing here?"), so keyboard and screen-reader users can find it too.
- **Unlisted.** The page is `noindex` and appears in neither the navigation nor the sitemap. You can still send the link straight to robot friends.

### 10.3 The residents

Prices were checked on Nov 10, 2026. They drift, so every entry carries a `checked:` date, and the weekly link check flags dead links.

**Microduck** (Pollen Robotics × Hugging Face; press reports say Seeed manufactures it)
- **In the scene:** waddles the brick paths, inspects ferns and chases fireflies. Tap it to **take the controls** (§10.6).
- **Registry:**

  | Item | Price |
  |---|---|
  | Microduck (pre-orders ship after April 2027) | **$399** |
  | Accessory Pack | $39 |
  | Charger Pack | $39 |
  | Dev Pack | $119 |
  | Chip-in | any amount |

**Open Duck Mini v2** (open source, about 42 cm tall)
- **In the scene:** the big sibling, strolling the paths with Microduck: a parent with its duckling.
- **Registry:**
  - **Parts list:**
    - 14× Feetech STS3215 servos (**$20** each at Seeed)
    - Raspberry Pi Zero 2W
    - BNO055 IMU
    - Waveshare bus-servo adapter
    - 18650 cells with a 2S BMS
    - foot switches
    - filament
  - **Chip-in** toward the full build (about €400 in parts)

**reBot Arm B601-DM** (Seeed; 6+1 DoF, 7 Damiao brushless actuators) **+ Star Arm 102 leader**
- **In the scene:** at the potting bench, gently repotting a fern and offering a rose. The leader arm sits beside it, as if someone is teleoperating.
- **Registry:**

  | Item | Price |
  |---|---|
  | Assembled kit with gripper | **$1,499** |
  | DIY bundle (the next three kits) | $1,197 |
  | ↳ Body Motor Kit | $829 |
  | ↳ Body Structure Kit | $169 |
  | ↳ Gripper Kit | $199 |
  | Star Arm 102 leader | about $259 |
  | DM-J4310-2EC actuator | about $116–186 |
  | DM-J4340P-2EC actuator | about $175–278 |
  | Chip-in | any amount |

Reference specs for the B601-DM:
- Payload: 1.5 kg
- Reach: 767 mm with the gripper
- LeRobot support: `rebot_b601_follower` and `rebot_102_leader`

### 10.4 The robot card

Tapping a robot slides up a brass-framed plant-tag panel with:
- the robot's name and a mock Latin "species" line, e.g. *Anas mechanica minor*
- a short "why we love it"
- the kit and parts list, each line with a store link, price and an **"I'm getting this"** button
- a **Chip in** row with Venmo (amount pre-filled) and PayPal.me buttons
- credit and license lines

### 10.5 How gifting works

- **Store links.** Each item links directly to Seeed, Pollen, RobotShop and so on.
  - Prefer US-warehouse listings. The US de minimis duty exemption has been suspended since August 2025, so parts shipped from China can carry duties.
- **Claims.** "I'm getting this" calls the same Apps Script (a `claim` action), which adds a row to the `RobotClaims` tab.
  - **What's recorded:** the item, the time, and an optional name and email.
  - **What the room shows:** claimed items are marked "Claimed ✓".
  - **Mistakes or pranks:** delete the row in the Sheet.
  - **Optional:** an email to you on each claim.
- **Chip-in links:**
  - Venmo: `venmo.com/<handle>?txn=pay&amount=<n>&note=<robot>%20fund`
  - PayPal: `paypal.me/<handle>/<n>USD`

  Venmo's documented link format is old, so test both on iOS, Android and desktop. Paying from balance or bank costs nothing.
- **Thank-yous.** `RobotClaims` and the Venmo/PayPal history are merged into the Sheet's `Thank-yous` tab.

### 10.6 3D approach: animated robots plus a live duck

#### What's built (v1, Nov 10)

- **Stack:** plain three.js 0.186 (no React), loaded only on `/after-hours/`. That's about 155 KB gzipped, plus the site's cached plant drawings.
- **Robots:** stylized low-poly portraits built from simple shapes, with each robot's real proportions and joints, rather than the official meshes. That means no mesh pipeline and no license questions.
  - The ducks walk the brick loop with a procedural waddle; the duckling follows its parent.
  - The arm runs a small IK solver to repot a fern seedling between two pots, with the leader arm mirroring it.
- **Scene:**
  - The night glasshouse: glazed iron bays with the moon behind them, lanterns, string lights and fireflies.
  - A brass armillary sphere stands in the middle of the loop.
  - The site's native-plant drawings stand around the room as painted flats.
- **"Take the controls":** steers Microduck kinematically (joystick, arrow keys or WASD), then it walks itself home. The MuJoCo-physics duck below is the upgrade path.
- **Cards and claims:** HTML cards (keyboard and screen-reader friendly), with claims through the Apps Script `claim` action and chip-in through Venmo/PayPal links.
- **Fallbacks:** a list without WebGL, and a still life under reduced motion.

#### Layer 1: everyone, on any phone (original plan)

- **Stack.** three.js r187, React Three Fiber 9 and drei, in a single Astro island that only loads on `/after-hours/`.
- **Models.** Each robot is built from its official model:
  - **Open Duck Mini v2 and the reBot B601-DM** come from URDF via `urdf-loader`, using its GLB mesh callback.
  - **Microduck** comes from its MJCF/GLB.
- **Mesh conversion** with gltf-transform:
  - Meshopt compression, storing positions only.
  - Normals are rebuilt in the browser.
  - Use `--flatten false --join false`, because the defaults merge the robot links and break the joints.
  - Measured: about 0.6–1.2 MB per robot at full detail, or about 100–350 KB simplified.
- **Motion.** Recorded joint clips, about 10 KB each: walk, idle, look-around and repot.
  - The clips are captured from each robot's own simulator: Microduck's sandbox, Open Duck Mini's MuJoCo playground and the reBot MJCF.
  - A small path-following state machine drives the robots: wander → pause → play.
- **Scene:**
  - A low-poly glasshouse of iron arches and glazing.
  - Instanced palms and ferns.
  - Lighting baked into textures.
  - Lanterns as emissive materials plus two point lights.
  - Fireflies as GPU points.
  - A moonlight shaft.
  - The glass is a low-opacity material with an environment map, rather than costly transmission, so phones stay fast.
- **First load:** about 2–3 MB, behind a lantern-lit progress screen.

#### Layer 2: tap Microduck → "Take the controls"

- **What loads, only on tap:**
  - The official `@mujoco/mujoco` WASM single-thread build, about 2.6 MB brotli. GitHub Pages can't send the COOP/COEP headers the multi-thread build needs, and single-thread is plenty.
  - Microduck's trained walking policy: about 0.8 MB of ONNX.
  - `onnxruntime-web`, about 2.7 MB. Alternatively, a few-line plain-JS MLP saves that 2.7 MB.
- **Built by porting Pollen's open-source Microduck Sandbox** (Apache-2.0). It uses the same stack: R3F plus MuJoCo WASM plus a 50 Hz policy.
- **Controls:** an on-screen joystick on phones; WASD/arrow keys and click-to-walk on desktop.
- **Measured cost:** a physics step takes about 95 µs and a policy call about 69 µs, around 2% of a CPU core. Physics runs in a Web Worker.
- **The duck run.** The live duck walks inside a fenced area in the glasshouse. Leaving returns it to animated mode.
- **Open Duck Mini stays animated.** A live port written from scratch would take 3–7 days with sim-mismatch risk, so it's a stretch goal.

#### Fallbacks and performance

- **Fallback view.** No WebGL, low power or reduced motion get a static illustrated night glasshouse with the same robot cards as a list.
- **Performance:**
  - The pixel ratio is capped at 1.5.
  - The scene renders only on demand when idle, and pauses in hidden tabs.

#### Effort (from the research spike)

| Piece | Estimate |
|---|---|
| Asset pipeline | ~1 day |
| Scene | 2–4 days |
| Live duck | 2–4 days |

### 10.7 Licenses and credits

These are shown in an "About these robots" footnote on the page.

| Model | Source | License | Notes |
|---|---|---|---|
| Microduck | `pollen-robotics/microduck_rl`, plus its Sandbox Space | Code: Apache-2.0. Meshes: CC BY-NC-SA. | Fine for a personal, non-commercial site with credit; converted meshes keep the same license. Pollen asks that it not be called "open-source hardware". |
| Microduck Sandbox | `pollen-robotics/microduck-simulator` (HF Space) | Apache-2.0 | The basis for live mode |
| Open Duck Mini v2 | `apirrone/Open_Duck_Mini` (v2) | Apache-2.0 | Include the license and credit. Avoid any Disney / BD-X branding. |
| reBot Arm B601-DM | `Seeed-Projects/reBot-DevArm` → `Rebot_Arm_description/DM/` | CERN-OHL-W-2.0 | Keep the notice. Our converted files stay public in this repo. |
| Star Arm 102 | No open model confirmed | n/a | Use a stylized stand-in if no model is found |

### 10.8 Data shape

One file per robot under `src/content/robots/`:

```yaml
# src/content/robots/microduck.yaml
id: microduck
name: Microduck
species: Anas mechanica minor
scene: { model: models/microduck.glb, clip: waddle, path: brick-loop, live: true }
blurb: "…"
kit:
  - { id: microduck-unit, label: Microduck, price: 399, url: "https://store.pollen-robotics.com/products/microduck" }
parts:
  - { id: microduck-accessory, label: Accessory Pack, price: 39, url: "…" }
chipIn: { suggested: [25, 50, 100], note: "Microduck fund" }
credit: "Model © Pollen Robotics, CC BY-NC-SA"
checked: 2026-11-10
```

---

## 11. Photos

### Selection

**Four photos on the whole site,** chosen with you.

**The rules:**

- Natural, relaxed expressions; no mid-expression frames.
- Ally front-facing or three-quarter, ideally waist-up.
- No side-profile or leaning-back poses of Ally.
- When in doubt, ask.

| Use | Photo (ColorGraded-NN) |
|---|---|
| Home hero and link preview (`public/og.jpg`) | **35**: smiling together beneath deep-pink blossoms |
| Our Story, and the home "Our Story" card | **20**: Mark on one knee, sliding the ring on as Ally smiles |
| Registry, and the home "Registry" card | **40**: her ring hand on his chest. Cropped waist-up, and a passer-by removed by the crop. |
| Travel, and the home "Travel" card | **62**: together on the stone bridge |

### Pipeline

1. **Download the originals.** Pull the chosen originals from the shared Drive folder. They stay in Drive, since at 10–26 MB each they're too big for git.
2. **Create masters.** `scripts/prepare-photos.mjs` uses sharp to make 2560px long-edge masters at quality 82 with metadata stripped, saved to `src/assets/photos/`. That's about 25 MB, committed.
3. **Responsive images.** Astro's `<Picture>` generates AVIF, WebP and JPEG at 480–2400w with lazy-loading. The hero is preloaded at roughly 150–250 KB AVIF.
4. **Art direction.** Desktop and mobile get separate hero crops; focal points are stored in data.
5. **Credit.** The photographer is credited in the footer. Confirm the wording and permission.

---

## 12. Tech stack and repo layout

- **Astro 7** (static output) with content collections and Zod schemas, in TypeScript.
- **Plain CSS:** global tokens in `src/styles/global.css` plus Astro scoped styles. Tailwind was dropped during the build, because the bespoke ornaments read better as hand-written CSS.
- **React islands** only for RSVP and the robot room.
- **PhotoSwipe 5** lightbox, **Fontsource** fonts, and **qrcode** for print-ready QR codes (SVG/PDF).
- **3D:** three.js, React Three Fiber, drei, `urdf-loader` and `@gltf-transform/cli` for the asset pipeline. `@mujoco/mujoco` (WASM) and `onnxruntime-web` load only for the live duck (§10).
- **QA:**
  - `astro check`
  - Playwright smoke tests: every page renders; unlock works with a test password; the RSVP happy path runs against a mocked endpoint.
  - Lighthouse CI budgets
  - lychee link checks

```
wedding-site/
├── astro.config.mjs        site: https://mleggiero.github.io · base: /wedding-site
├── src/
│   ├── config.ts           names, date, details password, contact email (later: RSVP URL, Zola, Venmo/PayPal)
│   ├── content.config.ts   schemas for the YAML content
│   ├── assets/photos/      web-ready masters (committed)
│   ├── components/         ArchFrame, Foliage, BotanicalSprite, Monogram, IronworkDivider, PlantTag,
│   │                       Countdown, PasswordGate, Gallery, Photo, PageHeader, SiteHeader, SiteFooter
│   ├── content/            chapters, proposal, faq, places, charities (.yaml); later registry/*, robots/*
│   ├── lib/                botanicals.ts (procedural plants), photos.ts, url.ts, inline-md.ts
│   ├── layouts/            Base.astro
│   ├── pages/              index, our-story, travel, registry, faq, details/, 404 (later: after-hours)
│   └── styles/             global.css
├── public/                 favicon, apple-touch-icon, og.jpg (later: models/ for robot GLBs)
├── print/                  save-the-date QR (SVG, PNG, PDF)
├── apps-script/            (later) RSVP + robot-claim backend
├── scripts/                prepare-photos, make-qr (later: build-robots)
├── tests/                  (later) Playwright
└── .github/workflows/      deploy.yml (push + nightly); later links.yml (weekly)
```

## 13. Deploy (GitHub Pages)

- **One-time setup:** in the repo, go to Settings → Pages → Source and choose **GitHub Actions**.
- **Workflow:** Astro's official GitHub Pages workflow, one small YAML file.
  - Every push to `main` rebuilds and publishes the site in about two minutes. That includes edits made in GitHub's web editor.
  - A nightly run refreshes the Every.org totals.
- **No secrets to manage.** The Apps Script URL, the Zola link and the Every.org public key all live in `src/config.ts`.
- **URL stability.** Printed QR codes are permanent, so never rename this repo or the GitHub account. If you add a custom domain later, GitHub redirects the `github.io` address automatically.

## 14. Accessibility, performance, sharing

- **Accessibility:**
  - WCAG 2.2 AA
  - 44px targets and visible brass focus rings
  - alt text on every photo
  - a keyboard-friendly lightbox, plus a 2D fallback for the robot room
- **Performance:**
  - Public pages ship essentially no JavaScript.
  - LCP stays under 2.5s on 4G.
  - The robot room loads on demand behind a progress screen.
- **Sharing:**
  - `noindex` everywhere.
  - Open Graph image and description, so texted links show the hero photo and the date.

---

## 15. Timeline

Today is Nov 10, 2026, and the wedding is 165 days away.

| When | Milestone |
|---|---|
| **Nov 10–12** | Enable Pages and deploy a one-page "Save the date" placeholder. Deliver the print QR (SVG, PNG, PDF) so save-the-date design isn't blocked. |
| **by ~Nov 23** | **v1:** Home, Our Story, Travel and field guide (text), FAQ v1, Registry "opening soon", the full design system, CI and deploy |
| Dec | Registry live (Zola and Every.org). Illustrated Athens map. Garden-map draft. |
| Jan | Robot glasshouse: animated scene, then the live duck. RSVP backend and UI. Friends-and-family test run. |
| **by ~Feb 12** | Protected details final, RSVP live, and the invitation QR (auto-unlock) sent to the stationer |
| ~Feb 27 – Mar 6 | Invitations mail, 7–8 weeks out |
| ~Mar 27 | RSVP deadline (confirm against the caterer's final-count date) |
| Apr 1–20 | Final updates; content freeze on April 20 |
| **Apr 24** | 🌿 |
| May | Thank-you message on Home; optional wedding-photo gallery |

### v1 checklist (save-the-date launch)

- [x] Astro scaffold, tokens, fonts and core components (`ArchFrame`, `Foliage`, `PlantTag`, `Monogram`, `IronworkDivider`)
- [x] Home: hero, countdown and cards
- [x] Our Story: proposal sequence and blossom gallery
- [x] Travel v1: getting here and a starter field-guide list. Hotel suggestions wait for the blocks.
- [x] FAQ v1
- [x] Registry teaser, with the two charities linked
- [x] Photo pipeline and the first 31 photos
- [x] `noindex`, Open Graph, favicon/monogram, 404
- [x] GitHub Pages deploy workflow, and the details password prompt (on a placeholder `/details/`)
- [x] Print-ready QR files (`print/`)
- [x] Direction revised: cozy maximalist conservatory, native plants, four photos, short copy (home hero graded 92/100)
- [x] Guest pages: Share a photo and Request a song (graded 92 desktop, 91 phone), plus the home "Join in" band (91)
- [ ] **You:** switch on Pages (Settings → Pages → Source: GitHub Actions)
- [ ] **You:** set up the Apps Script web app (`apps-script/README.md`) and paste its URL into `guestEndpoint`
- [x] Restyle Our Story, Travel, Registry, FAQ, Details, 404, header and footer in the new direction (each graded 91–92)
- [x] After Hours robot room (graded 92): stylized 3D robots, gift cards, claims, chip-in, steerable Microduck, list fallback
- [ ] **You:** Venmo/PayPal handles for robot chip-ins (`venmoHandle`, `paypalHandle`)
- [ ] Later: official robot meshes and the live MuJoCo Microduck (§10.6)

## 16. What we need from you two

- **Our Story:** how you met, the proposal (where and when), and 2–4 milestones.
- **Photo picks:** confirm or swap the picks in §11, plus the photographer credit wording.
- **Travel:** hotel suggestions now. Block names, links, codes and cutoff dates later.
- **FAQ answers:** dress code, children, plus-ones, unplugged ceremony.
- **Registry:**
  - Zola registry URL and fund list
  - 8–16 highlight items
  - a sentence about why each charity matters to you
- **Robot room:**
  - a sentence about why you love each robot
  - any parts you already own (to leave off the list)
  - your Venmo and PayPal.me handles for chip-ins
- **The details password:** any easy word, e.g. *greenhouse*. Or no password at all.
- **A contact email** for guest questions.
- **Guest uploads and songs:**
  - run the six-step Apps Script setup in `apps-script/README.md` (a private Drive folder plus a Sheet)
  - your Spotify playlist link for the Songs page

## 17. Open items (non-blocking)

- Venue logistics for the garden map and accessible route: confirm with the coordinator.
- Shuttle or no shuttle between downtown hotels and the garden.
- RSVP deadline vs. the caterer's final-count date.
- Whether Every.org's amount-raised endpoint can be called from the browser. Build-time fetching works either way.
- **Microduck timing:** current pre-orders ship after April 2027, so the gift arrives after the wedding. Mention that on the card.
- **Star Arm 102 model:** if no open 3D model exists, use a stylized stand-in.
- **Venmo/PayPal link formats:** test on iOS, Android and desktop before launch.
- **Robot prices:** these drift, and Damiao actuator prices vary a lot by reseller. Re-check them in January.
