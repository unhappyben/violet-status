// Shared subscription storage via Vercel Edge Config REST API.
// Subscriptions are stored under the "subscriptions" key as an object
// keyed by each subscription's auth secret.
const EC_ID = process.env.EDGE_CONFIG_ID;
const TOKEN = process.env.VERCEL_API_TOKEN;
// Team-owned Edge Configs require ?teamId= on every REST call — without it
// the API answers 403 even with a valid token.
const TEAM = process.env.VERCEL_TEAM_ID;
const ITEMS_URL = 'https://api.vercel.com/v1/edge-config/' + EC_ID + '/items' +
  (TEAM ? '?teamId=' + TEAM : '');

async function getSubscriptions() {
  const res = await fetch(ITEMS_URL, {
    headers: { Authorization: 'Bearer ' + TOKEN }
  });
  if (!res.ok) {
    throw new Error('edge-config read failed: HTTP ' + res.status + ' ' + (await res.text()));
  }
  const items = await res.json();
  const entry = items.find(function (i) { return i.key === 'subscriptions'; });
  return (entry && entry.value) || {};
}

async function saveSubscriptions(subs) {
  const res = await fetch(ITEMS_URL, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: 'subscriptions', value: subs }]
    })
  });
  if (!res.ok) {
    throw new Error('edge-config write failed: HTTP ' + res.status + ' ' + (await res.text()));
  }
}

module.exports = { getSubscriptions, saveSubscriptions };
