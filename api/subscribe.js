// POST /api/subscribe — store a browser push subscription.
// Accepts either a bare PushSubscription or { subscription, muted }.
// Subscriptions are keyed by auth secret; "muted" devices are never pushed.
const { getSubscriptions, saveSubscriptions } = require('./_store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const body = req.body || {};
  const sub = body.subscription || body;
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.auth || !sub.keys.p256dh) {
    return res.status(400).json({ ok: false, error: 'invalid subscription' });
  }

  try {
    const subs = await getSubscriptions();

    // One subscription per endpoint — iOS can rotate the auth key over time,
    // which would otherwise leave a stale duplicate that still gets pushed.
    Object.keys(subs).forEach(function (id) {
      if (subs[id] && subs[id].endpoint === sub.endpoint && id !== sub.keys.auth) {
        delete subs[id];
      }
    });

    const existing = subs[sub.keys.auth];
    subs[sub.keys.auth] = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      // Explicit muted flag wins; otherwise preserve the server's value.
      muted: ('muted' in body) ? !!body.muted : !!(existing && existing.muted),
      updatedAt: Date.now()
    };

    await saveSubscriptions(subs);
    res.json({ ok: true, count: Object.keys(subs).length, muted: subs[sub.keys.auth].muted });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
