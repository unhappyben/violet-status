// Copy this file to config.js and fill in your own values.
// config.js is gitignored so your secrets stay out of the repo.
var CONFIG = {
  // The /api/notify endpoint of your violet-status server (see server.py).
  NOTIFY_URL: 'http://YOUR_SERVER:8787/api/notify',

  // Shared secret — must match "token" in server-config.json on the server.
  // Generate one with:  openssl rand -hex 16
  NOTIFY_TOKEN: 'CHANGE_ME',

  // sha256 hex of your unlock password (ASCII only):
  //   printf 'yourpassword' | shasum -a 256
  PASSWORD_HASH: 'CHANGE_ME'
};
