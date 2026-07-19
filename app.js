(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  // Guard: config.js is gitignored, so a fresh clone won't have it.
  if (typeof CONFIG === 'undefined') {
    document.body.innerHTML =
      '<p style="padding:2em;font-family:-apple-system,sans-serif;line-height:1.5">' +
      'Missing <code>config.js</code>. Copy <code>config.example.js</code> to ' +
      '<code>config.js</code> and fill in your values.</p>';
    return;
  }

  var DEFAULT_STATUSES = [
    '💤 Violet asleep',
    '👀 Violet awake',
    '🚶 Gone for a walk',
    '🎒 In the baby carrier'
  ];

  var LS_CUSTOM = 'vn_custom_statuses_v1';
  var LS_HISTORY = 'vn_history_v1';
  var LS_UNLOCKED = 'vn_unlocked_v1';

  var custom = load(LS_CUSTOM, []);
  var historyLog = load(LS_HISTORY, []);
  var selectedIdx = -1;
  var sending = false;

  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var lockScreen = $('lockScreen'), appScreen = $('appScreen'),
      lockForm = $('lockForm'), passwordInput = $('passwordInput'),
      lockError = $('lockError'), lockBtn = $('lockBtn'),
      statusGrid = $('statusGrid'), addForm = $('addForm'),
      newStatusInput = $('newStatusInput'), notifyBtn = $('notifyBtn'),
      historyList = $('historyList'), toast = $('toast');

  function allStatuses() { return DEFAULT_STATUSES.concat(custom); }

  // ---------- lock screen ----------

  function showApp() {
    lockScreen.hidden = true;
    appScreen.hidden = false;
    renderStatuses();
    renderHistory();
    updateNotifyBtn();
  }

  function showLock() {
    appScreen.hidden = true;
    lockScreen.hidden = false;
    passwordInput.value = '';
    lockError.textContent = '';
  }

  lockForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var hash = sha256(passwordInput.value);
    if (hash && hash === CONFIG.PASSWORD_HASH) {
      save(LS_UNLOCKED, true);
      showApp();
    } else {
      lockError.textContent = 'Wrong password';
      passwordInput.select();
    }
  });

  lockBtn.addEventListener('click', function () {
    try { localStorage.removeItem(LS_UNLOCKED); } catch (e) {}
    showLock();
  });

  // ---------- statuses ----------

  function renderStatuses() {
    statusGrid.innerHTML = '';
    allStatuses().forEach(function (label, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'status-card' + (idx === selectedIdx ? ' selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', idx === selectedIdx ? 'true' : 'false');

      var span = document.createElement('span');
      span.textContent = label;
      btn.appendChild(span);

      if (idx >= DEFAULT_STATUSES.length) {
        var del = document.createElement('span');
        del.className = 'delete';
        del.textContent = '×';
        del.setAttribute('aria-label', 'Delete status');
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          custom.splice(idx - DEFAULT_STATUSES.length, 1);
          save(LS_CUSTOM, custom);
          if (selectedIdx === idx) {
            selectedIdx = -1;
            updateNotifyBtn();
          } else if (selectedIdx > idx) {
            selectedIdx--;
          }
          renderStatuses();
        });
        btn.appendChild(del);
      }

      btn.addEventListener('click', function () {
        selectedIdx = idx;
        renderStatuses();
        updateNotifyBtn();
      });

      statusGrid.appendChild(btn);
    });
  }

  function updateNotifyBtn() {
    if (selectedIdx < 0) {
      notifyBtn.disabled = true;
      notifyBtn.textContent = 'Pick a status first';
    } else {
      notifyBtn.disabled = sending;
      notifyBtn.innerHTML = '';
      notifyBtn.appendChild(document.createTextNode('Notify Galina 🔔'));
      var sub = document.createElement('small');
      sub.textContent = allStatuses()[selectedIdx];
      notifyBtn.appendChild(sub);
    }
  }

  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = newStatusInput.value.trim();
    if (!v) return;
    if (allStatuses().indexOf(v) !== -1) {
      showToast('That status already exists', true);
      return;
    }
    custom.push(v);
    save(LS_CUSTOM, custom);
    newStatusInput.value = '';
    renderStatuses();
    showToast('Status added');
  });

  // ---------- notify ----------

  notifyBtn.addEventListener('click', function () {
    if (selectedIdx < 0 || sending) return;
    var label = allStatuses()[selectedIdx];
    var time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    sending = true;
    notifyBtn.disabled = true;

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 10000);

    fetch(CONFIG.NOTIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': CONFIG.NOTIFY_TOKEN
      },
      body: JSON.stringify({ message: label + ' — ' + time }),
      signal: controller.signal
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showToast('Sent to Galina ✓');
      addHistory(label);
    }).catch(function () {
      clearTimeout(timer);
      showToast('Failed to send — check connection', true);
    }).then(function () {
      sending = false;
      updateNotifyBtn();
    });
  });

  // ---------- history ----------

  function addHistory(label) {
    historyLog.unshift({ label: label, at: Date.now() });
    if (historyLog.length > 15) historyLog.length = 15;
    save(LS_HISTORY, historyLog);
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (!historyLog.length) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nothing sent yet';
      historyList.appendChild(li);
      return;
    }
    historyLog.forEach(function (item) {
      var li = document.createElement('li');
      var d = new Date(item.at);
      li.textContent = item.label;
      var t = document.createElement('time');
      t.textContent = d.toLocaleDateString([], { weekday: 'short' }) + ' ' +
                      d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      li.appendChild(t);
      historyList.appendChild(li);
    });
  }

  // ---------- toast ----------

  var toastTimer;
  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.className = ''; }, 2600);
  }

  // ---------- init ----------

  if (load(LS_UNLOCKED, false)) { showApp(); } else { showLock(); }

  // Service worker only works over https (or localhost) — fine, the app
  // works without it too.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
