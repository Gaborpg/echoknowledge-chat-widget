// /embed.js
(function () {
  if (window.__echoWidgetLoaded) return;        // 1) idempotent
  window.__echoWidgetLoaded = true;

  function start() {
    const d = document, s = d.currentScript;
    const base = (s?.dataset.base || '').replace(/\/$/, '');
    if (!base) { console.error('[EchoWidget] data-base is required'); return; }

    // Pass CSP nonce to the app (dynamic imports won't see currentScript in main.js)
    const nonce = s?.nonce || s?.getAttribute?.('nonce') || '';
    window.__echoNonce = nonce;                  // 2) hand-off for CSP_NONCE

    // Create element first so it auto-upgrades when main loads
    let el = d.querySelector('echo-knowledge-chat-widget');
    if (!el) { el = d.createElement('echo-knowledge-chat-widget'); d.body.appendChild(el); }

    // Map data-* -> attributes
    const A = {
      'bot-id':    s.dataset.botId   || 'default',
      'mode':      s.dataset.mode    || 'popup',
      'side':      s.dataset.side    || 'auto',
      'top':       s.dataset.top     || '10',
      'right':     s.dataset.right   || '24',
      'width':     s.dataset.width   || '406px',
      'height':    s.dataset.height  || '85%',
      'close':     s.dataset.close   || 'outside',
      'primary':   s.dataset.primary || '',
      'auto-open': s.dataset.autoOpen|| 'false',
      'include':   s.dataset.include || '',
      'exclude':   s.dataset.exclude || ''
    };
    for (const [k, v] of Object.entries(A)) el.setAttribute(k, String(v));

    // Optional stylesheet (ok if it 404s). Respect nonce if present.
    const css = d.createElement('link');
    css.rel = 'stylesheet';
    css.href = base + '/styles.css';
    if (nonce) css.setAttribute('nonce', nonce);
    d.head.appendChild(css);

    // 3) Try main first; if it errors (needs polyfills), load polyfills then retry
    const main = base + '/main.js';
    const poly = base + '/polyfills.js';
    import(main).catch(async () => {
      try { await import(poly); await import(main); }
      catch (e) { console.error('[EchoWidget] failed to load widget', e); }
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
