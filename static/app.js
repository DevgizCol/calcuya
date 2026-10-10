// Conecta cada formulario [data-tool] con su función en TOOLS (assets/tools.js)
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento no disponible */ } },
};
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const BAR_COLORS = ['var(--brand)', 'var(--c2)', 'var(--c3)', 'var(--c4)'];

document.querySelectorAll('input[data-today]').forEach(i => {
  const d = new Date();
  i.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

document.querySelectorAll('form[data-tool]').forEach(form => {
  const box = form.parentElement;
  const out = box.querySelector('.result');
  const actions = box.querySelector('.actions');
  const tool = form.dataset.tool;
  const persist = 'persist' in form.dataset;
  const fields = [...form.elements].filter(f => f.name);
  let seq = 0;
  let rows = null;

  // Valores iniciales: enlace compartido > último uso guardado > valores por defecto
  const saved = (persist && store.get('cy:' + tool)) || {};
  const params = new URLSearchParams(location.search);
  for (const f of fields) {
    if (f.type === 'hidden') continue;
    const v = params.has(f.name) ? params.get(f.name) : saved[f.name];
    if (v != null && v !== '') f.value = v;
  }

  const msg = text => {
    rows = null;
    actions.hidden = true;
    out.replaceChildren(el('p', 'muted', text));
  };

  const chart = r => {
    if (r.marker != null) {
      const scale = el('div', 'scale');
      const pin = el('span', 'pin');
      pin.style.left = r.marker + '%';
      scale.append(pin);
      return [scale];
    }
    const parts = (r.bars || []).filter(([, v]) => v > 0);
    const total = parts.reduce((t, [, v]) => t + v, 0);
    if (parts.length < 2 || !total) return [];
    const bar = el('div', 'bar');
    const legend = el('div', 'legend');
    parts.forEach(([label, v], i) => {
      const seg = el('span');
      seg.style.flexGrow = v;
      seg.style.background = BAR_COLORS[i % BAR_COLORS.length];
      bar.append(seg);
      const item = el('span', null, `${label} ${Math.round((v / total) * 100)}%`);
      item.style.setProperty('--dot', BAR_COLORS[i % BAR_COLORS.length]);
      legend.append(item);
    });
    return [bar, legend];
  };

  const run = async () => {
    const id = ++seq;
    const v = {};
    for (const f of fields) {
      v[f.name] = f.type === 'number' ? parseFloat(f.value) : f.value;
      if (f.dataset.money != null) f.closest('label').querySelector('.hint').textContent = f.value && Math.abs(v[f.name]) >= 1000 ? '$ ' + fmt(v[f.name]) : '';
      if (f.type === 'number' && Number.isNaN(v[f.name])) return msg('Completa todos los campos para ver el resultado.');
    }
    if (persist) store.set('cy:' + tool, Object.fromEntries(fields.filter(f => f.type !== 'hidden').map(f => [f.name, f.value])));
    try {
      const r = await TOOLS[tool](v);
      if (id !== seq) return;
      if (!r) return msg('Completa todos los campos para ver el resultado.');
      rows = r;
      out.replaceChildren(
        ...r.slice(0, 1).map(([k, val]) => { const d = el('div', 'row main'); d.append(el('span', null, k), el('strong', null, val)); return d; }),
        ...chart(r),
        ...r.slice(1).map(([k, val]) => { const d = el('div', 'row'); d.append(el('span', null, k), el('strong', null, val)); return d; }),
      );
      actions.hidden = false;
    } catch {
      if (id === seq) msg('No se pudo calcular. Revisa los datos e inténtalo de nuevo.');
    }
  };

  const shareUrl = () => {
    const q = new URLSearchParams(fields.filter(f => f.type !== 'hidden' && f.value !== '').map(f => [f.name, f.value]));
    return `${location.origin}${location.pathname}?${q}`;
  };
  const summary = () => `${document.querySelector('h1').textContent}\n${rows.map(([k, val]) => `${k}: ${val}`).join('\n')}`;
  const flash = (btn, text) => {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1600);
  };
  const copy = async (btn, text) => {
    try { await navigator.clipboard.writeText(text); flash(btn, '¡Copiado!'); } catch { flash(btn, 'No se pudo copiar'); }
  };

  actions.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn || !rows) return;
    if (btn.dataset.act === 'copy') copy(btn, summary());
    if (btn.dataset.act === 'share') {
      if (navigator.share) navigator.share({ title: document.title, text: summary(), url: shareUrl() }).catch(() => {});
      else copy(btn, shareUrl());
    }
    if (btn.dataset.act === 'print') {
      document.getElementById('print-date').textContent = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
      window.print();
    }
    if (btn.dataset.act === 'wa') btn.href = 'https://wa.me/?text=' + encodeURIComponent(`${summary()}\n\n${shareUrl()}`);
  });
  form.addEventListener('input', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
  run();
});

// Calculadoras usadas recientemente (solo en este dispositivo)
const meta = document.getElementById('tool-meta');
if (meta) {
  const { href, icon, name } = meta.dataset;
  store.set('cy:recent', [{ href, icon, name }, ...(store.get('cy:recent') || []).filter(r => r.href !== href)].slice(0, 4));
}
const recent = document.getElementById('recientes');
const list = recent && (store.get('cy:recent') || []).filter(r => typeof r.href === 'string' && r.href.startsWith('/'));
if (recent && list.length) {
  recent.querySelector('.grid').append(...list.map(r => {
    const a = el('a', 'card row-card');
    a.href = r.href;
    a.append(el('span', 'ico', r.icon), el('strong', null, r.name));
    return a;
  }));
  recent.hidden = false;
}

// Buscador de la portada
const q = document.getElementById('q');
if (q) {
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const cards = [...document.querySelectorAll('.card[data-search]')].map(c => [c, norm(c.dataset.search)]);
  const filter = () => {
    const words = norm(q.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const [c, text] of cards) {
      c.hidden = !words.every(w => text.includes(w));
      if (!c.hidden) shown++;
    }
    document.querySelectorAll('main section').forEach(sec => {
      const own = sec.querySelectorAll('.card[data-search]');
      if (own.length) sec.hidden = ![...own].some(c => !c.hidden);
    });
    document.getElementById('noresults').hidden = shown > 0;
    recent.hidden = words.length > 0 || !list.length;
  };
  q.addEventListener('input', filter);
  q.addEventListener('keydown', e => {
    const first = cards.find(([c]) => !c.hidden);
    if (e.key === 'Enter' && q.value.trim() && first) location.href = first[0].href;
  });
}
