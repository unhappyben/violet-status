// Copy this file to config.js and fill in your own values.
// config.js is gitignored so your secret topic stays out of the repo.
var CONFIG = {
  NTFY_SERVER: 'https://ntfy.sh',
  // Pick a long, random, unguessable topic name, e.g.:
  //   echo "violet-status-$(openssl rand -hex 4)"
  TOPIC: 'violet-status-CHANGE_ME',

  // sha256 hex of your unlock password (ASCII only):
  //   printf 'yourpassword' | shasum -a 256
  PASSWORD_HASH: 'CHANGE_ME',

  NOTIFY_TITLE: 'Violet update'
};
