# Trips

A fast, offline-capable PWA showing trips on a beautiful day-by-day timeline. Live: https://ncheewee.github.io/trips/

- **Owner view** (`?trip=<id>`): confirmation numbers (tap to copy), one-tap *Open booking email*, maps, tap-to-call, Add item, Export JSON, .ics calendar.
- **Share view** (`?trip=<id>&view=share`): read-only for family/friends; hides Gmail links, confirmation numbers and private notes.
- Install: open in Safari/Chrome → *Add to Home Screen*.

## Data & privacy
Trips live in `data/trips.json`. **The repo is public** — never put PINs, prices or payment details there. Private notes entered in the app stay in this device's `localStorage` only.

## Adding trips
1. **In the app:** open a trip → *Add item* (saved on this device) → *Export JSON* → replace `data/trips.json` and commit.
2. **Ask Grok Bot:** "add my booking to trips" — Grok Bot edits `data/trips.json` (from the confirmation email) and pushes; Pages redeploys in ~1 min.

Item fields: `id, type (flight|hotel-checkin|hotel-checkout|event|train|food|place), title, subtitle, start (ISO with offset), tz, address, phone, phoneDisplay, provider, confirmation, emailUrl, note, allTrip`.

## Check inbox (owner)
Home → **📥 Check inbox** POSTs `{"source":"trips-app","requestedAt":"<iso>"}` to your Grok Bot routine webhook (set once via ⚙︎ — URL and sender key live in this device's localStorage only). The key is sent as `Authorization: Bearer`, `X-Webhook-Key` and `X-Sender-Key`. If CORS blocks the request, it retries as `no-cors` (key passed as `?key=`). The app then polls `data/trips.json` every 20s for 5 min and refreshes when it changes. `data/scan-state.json` records the last scan.

## Images & themes
Each trip may set `image` (path prefix; app loads `<image>-hero.webp` 1600px and `<image>-card.webp` 800px) and `theme` `{accent, accent2, tint, chip}`. Trips without them get a hash-based palette and the generic travel image.

Image credits (all from Wikimedia Commons, stored in `img/`, resized/converted to WebP):
- Tokyo — "Minato City, Tokyo, Japan (Night)" by David Kernan, CC BY 4.0 — https://commons.wikimedia.org/wiki/File:Minato_City,_Tokyo,_Japan_(Night).jpg
- Korea — "Gwangan Bridge seen Marine City at Night 02" by Jeena Paradies, Public domain — https://commons.wikimedia.org/wiki/File:Gwangan_Bridge_seen_Marine_City_at_Night_02.jpg
- Generic — "Sunset view from an airplane window above the clouds" by Salwa F, CC0 — https://commons.wikimedia.org/wiki/File:Sunset_view_from_an_airplane_window_above_the_clouds.jpg

## Install troubleshooting (Android Chrome)
"Already installed / Open in app" is Chrome's own message: a WebAPK with the same manifest id is on the phone. Uninstall old Trips/2048 icons (long-press → App info → Uninstall), then Chrome → Settings → Site settings → All sites → ncheewee.github.io → Clear & reset, reopen and ⋮ → Install app.
