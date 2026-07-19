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
- `config.js` — **gitignored client config** (`NOTIFY_TOKEN`, `VAPID_PUBLIC_KEY`,
  `PASSWORD_HASH`). Still deployed, because `.vercelignore` overrides
  `.gitignore`. Template: `config.example.js`.
- `server.py`, `server-config.example.json` — legacy self-hosted ntfy-proxy
  variant, kept for reference; not used by the Vercel deploy.
- `gen_icons.py` — regenerates `icons/` (needs Pillow)

## Server config (Vercel env vars)

`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
`NOTIFY_TOKEN`, `EDGE_CONFIG_ID`, `VERCEL_API_TOKEN`

## Deploy

```sh
npx vercel --prod
```

## Change the password

```sh
printf 'newpassword' | shasum -a 256   # ASCII only
```

Paste the hex into `PASSWORD_HASH` in `config.js`, then redeploy.

## Honest security note

The unlock password is a client-side gate: it keeps casual snoopers out, but
anyone who can load the page can read `config.js` in the source and could POST
to `/api/notify` themselves. Real protection = obscure URL + shared token.
Don't publish the site URL.
