# Violet Status

One-tap baby status updates. Tap a status, tap **Notify Galina**, and a push
notification arrives on her iPhone. No apps to install, no third-party
services — a static PWA + serverless functions on Vercel, using the Web Push
API that's built into iOS.

## How it works

```
PWA (Ben's phone)  --POST /api/notify-->  Vercel function  --web push-->  Apple APNs  -->  Galina's iPhone
PWA (Galina's)     --POST /api/subscribe->  Vercel function  --store-->  Vercel Edge Config
```

- The app is a password-gated PWA: pick a status → big **Notify Galina** button.
- Galina installs nothing: she opens the site in Safari, **Share → Add to Home
  Screen**, opens the app, taps **Enable notifications**, taps Allow. iOS then
  delivers pushes even with the app closed (requires iOS 16.4+).
- Push subscriptions are stored in Vercel Edge Config; `api/notify` sends to
  all of them via the `web-push` library (VAPID).
- Apple's APNs is the delivery pipe — that's how every iOS push works; there
  is no Apple-free push on iPhone. Nothing else third-party is involved.

## Files

- `index.html`, `style.css`, `app.js`, `sha256.js` — the PWA
- `sw.js`, `manifest.webmanifest`, `icons/` — PWA shell + push handler
- `api/subscribe.js`, `api/notify.js`, `api/_store.js` — serverless functions
- `api/client-config.js` — serves the client config as JS, built from env
  vars, so no secrets live in the repo
- `server.py`, `config.example.js`, `server-config.example.json` — legacy
  self-hosted variant (ntfy proxy on a plain server), kept for reference;
  not used by the Vercel deploy
- `gen_icons.py` — regenerates `icons/` (needs Pillow)

## Server config (Vercel env vars, all Production)

`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`NOTIFY_TOKEN`, `PASSWORD_HASH`, `EDGE_CONFIG_ID`, `VERCEL_API_TOKEN`

## Deploy

```sh
npx vercel --prod
```

## Change the password

```sh
printf 'newpassword' | shasum -a 256   # ASCII only
printf '%s' '<hex digest>' | npx vercel env add PASSWORD_HASH production --force
npx vercel --prod
```

## Honest security note

The unlock password is a client-side gate: it keeps casual snoopers out, but
anyone who can load the page can read the config in the source and could POST
to `/api/notify` themselves. Real protection = obscure URL + shared token.
Don't publish the site URL.
