// Copy this file to config.js and fill in your own values.
// config.js is gitignored so your secrets stay out of the repo.
var CONFIG = {
  // Same-origin serverless endpoint.
  NOTIFY_URL: '/api/notify',

  // Shared secret — must match the NOTIFY_TOKEN env var on the server.
  // Generate one with:  openssl rand -hex 16
  NOTIFY_TOKEN: 'CHANGE_ME',

  // Public half of your VAPID pair:  npx web-push generate-vapid-keys
  // (the private half goes in the VAPID_PRIVATE_KEY env var, never here)
  VAPID_PUBLIC_KEY: 'CHANGE_ME',

  // sha256 hex of your unlock password (ASCII only):
  //   printf 'yourpassword' | shasum -a 256
  PASSWORD_HASH: 'CHANGE_ME'
};
