# Violet Status

One-tap baby status updates. Tap a status, tap **Notify Galina**, and a push
notification arrives on her iPhone via [ntfy](https://ntfy.sh) — no backend of
our own needed, the PWA is fully static.

## How it works

- The web app is a static PWA: lock screen (password) → pick a status → big
  **Notify Galina** button → POST to `https://ntfy.sh/<secret topic>`.
- Galina's phone runs the free **ntfy** app, subscribed to that topic. ntfy
  delivers real push notifications over APNs, so it works with the app closed.
- Custom statuses are stored in `localStorage` on the sending device.

## Files

- `index.html`, `style.css`, `app.js`, `sha256.js` — the app
- `config.js` — **secrets (ntfy topic + password hash), gitignored, do not commit.**
  Use `config.example.js` as the template.
- `gen_icons.py` — regenerates `icons/` (needs Pillow)
- `sw.js`, `manifest.webmanifest` — PWA shell (service worker active over HTTPS only)

## Setup — receiving phone (Galina)

1. Install the **ntfy** app from the App Store.
2. Tap **+** and subscribe to the topic from `config.js` (`TOPIC`).
3. That's it — notifications arrive like any other push.

## Setup — sending phone

Open the site, enter the password, then **Share → Add to Home Screen** to use
it like an app.

## Change the password

```sh
printf 'newpassword' | shasum -a 256   # ASCII only
```

Paste the hex digest into `PASSWORD_HASH` in `config.js`.

## Deploy

Serve the folder with any static file server. Example (as used on our VPS):

```sh
python3 -m http.server 8787 --directory /opt/violet-status
```

## Honest security note

The password is a client-side gate: it keeps casual snoopers out, but anyone
who can load the page can read `config.js` in the source. The real protection
is the unguessable ntfy topic name and not sharing the site URL.
