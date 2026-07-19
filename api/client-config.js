// GET /api/client-config — serves the client-side config as JS, built from
// Vercel env vars. Secrets live only in env vars, never in the repo.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send('var CONFIG = ' + JSON.stringify({
    NOTIFY_URL: '/api/notify',
    NOTIFY_TOKEN: process.env.NOTIFY_TOKEN || '',
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    PASSWORD_HASH: process.env.PASSWORD_HASH || ''
  }) + ';\n');
};
