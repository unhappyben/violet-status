// Shared subscription storage via Vercel Edge Config REST API.
// Subscriptions are stored under the "subscriptions" key as an object
// keyed by each subscription's auth secret.
const EC_ID = process.env.EDGE_CONFIG_ID;
const TOKEN = process.env.VERCEL_API_TOKEN;
const API = 'https://api.vercel.com/v1/edge-config/' + EC_ID;

async function getSubscriptions() {
  const res = await fetch(API + '/items', {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });
  if (!res.ok) throw new Error('edge-config read failed: HTTP ' + res.status);
  const items = await res.json();
  const entry = items.find(function (i) { return i.key === 'subscriptions'; });
  return (entry && entry.value) || {};
}

async function saveSubscriptions(subs) {
  const res = await fetch(API + '/items', {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: 'subscriptions', value: subs }]
    })
  });
  if (!res.ok) throw new Error('edge-config write failed: HTTP ' + res.status);
}

module.exports = { getSubscriptions, saveSubscriptions };
