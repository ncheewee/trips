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
