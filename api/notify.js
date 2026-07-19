// POST /api/notify — send a web push to every stored subscription.
// Requires the shared X-Token header (matches NOTIFY_TOKEN in client config).
const webpush = require('web-push');
const { getSubscriptions, saveSubscriptions } = require('./_store');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if ((req.headers['x-token'] || '') !== process.env.NOTIFY_TOKEN) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const message = String((req.body && req.body.message) || '').trim().slice(0, 200);
  if (!message) return res.status(400).json({ ok: false, error: 'empty message' });

  let subs;
  try {
    subs = await getSubscriptions();
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }

  const entries = Object.entries(subs);
  if (!entries.length) {
    return res.json({
      ok: false,
      error: 'No devices subscribed yet — enable notifications on Galina\'s phone first'
    });
  }

  const payload = JSON.stringify({ title: 'Violet update', body: message });
  const dead = [];
  let sent = 0;

  await Promise.all(entries.map(async function (pair) {
    try {
      await webpush.sendNotification(pair[1], payload, { TTL: 43200 });
      sent++;
    } catch (e) {
      // 404/410 = subscription expired or revoked — prune it
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(pair[0]);
      console.error('push failed:', e.statusCode, e.body || e.message);
    }
  }));

  if (dead.length) {
    dead.forEach(function (id) { delete subs[id]; });
    try { await saveSubscriptions(subs); } catch (e) { console.error(e); }
  }

  res.json({
    ok: sent > 0,
    sent: sent,
    total: entries.length,
    error: sent > 0 ? undefined : 'Push was not accepted by any device — check subscriptions'
  });
};
