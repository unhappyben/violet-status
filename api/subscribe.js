// POST /api/subscribe — store a browser push subscription.
const { getSubscriptions, saveSubscriptions } = require('./_store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const sub = req.body;
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.auth || !sub.keys.p256dh) {
    return res.status(400).json({ ok: false, error: 'invalid subscription' });
  }

  try {
    const subs = await getSubscriptions();
    subs[sub.keys.auth] = sub;
    await saveSubscriptions(subs);
    res.json({ ok: true, count: Object.keys(subs).length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
};
