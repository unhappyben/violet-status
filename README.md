# Violet Status

One-tap baby status updates. Tap a status, tap **Notify Galina**, and a push
notification arrives on her iPhone via [ntfy](https://ntfy.sh).

## How it works

```
PWA (phone)  --POST /api/notify-->  VPS (server.py)  --POST-->  ntfy.sh  --APNs-->  Galina's iPhone
```

- The web app is a static PWA: lock screen (password) → pick a status → big
  **Notify Galina** button.
- `server.py` serves the app and proxies the notify call to ntfy. This keeps
  the secret ntfy topic on the server (not in view-source) and works even on
  networks whose DNS blocks ntfy.sh.
- Galina's phone runs the free **ntfy** app, subscribed to the topic. ntfy
  delivers real push notifications over APNs, so it works with the app closed.
- Custom statuses and history are stored in `localStorage` on the sending device.

## Files

- `index.html`, `style.css`, `app.js`, `sha256.js` — the PWA
- `server.py` — static server + `/api/notify` proxy (stdlib only, no deps)
- `config.js` — **client secrets, gitignored** (`NOTIFY_URL`, `NOTIFY_TOKEN`,
  `PASSWORD_HASH`). Template: `config.example.js`.
- `server-config.json` — **server secrets, gitignored** (ntfy `topic`,
  shared `token`). Template: `server-config.example.json`.
- `gen_icons.py` — regenerates `icons/` (needs Pillow)
- `sw.js`, `manifest.webmanifest` — PWA shell (service worker active over HTTPS only)

## Setup — receiving phone (Galina)

1. Install the **ntfy** app from the App Store.
2. Tap **+** and subscribe to the topic from `server-config.json`.
3. That's it — notifications arrive like any other push.

## Setup — sending phone

Open the site, enter the password, then **Share → Add to Home Screen** to use
it like an app.

## Change the password

```sh
printf 'newpassword' | shasum -a 256   # ASCII only
```

Paste the hex digest into `PASSWORD_HASH` in `config.js` on the server (and in
your local copy), then hard-refresh the page.

## Deploy

```sh
# create server-config.json from the example, then:
python3 server.py          # serves on :8787 (PORT env var to change)
```

Runs as a systemd service on our VPS — see `/etc/systemd/system/violet-status.service`.

## Honest security note

The unlock password is a client-side gate: it keeps casual snoopers out, but
anyone who can load the page can read `config.js` in the source and could POST
to the proxy themselves. Real protection = obscure URL + the shared token, and
the ntfy topic itself never leaves the server. Don't publish the site URL.
