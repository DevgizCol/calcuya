// Conecta cada formulario [data-tool] con su función en TOOLS (assets/tools.js)
document.querySelectorAll('input[data-today]').forEach(el => {
  const d = new Date();
  el.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

document.querySelectorAll('form[data-tool]').forEach(form => {
  const out = form.parentElement.querySelector('.result');
  let seq = 0;
  const msg = text => {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = text;
    out.replaceChildren(p);
  };
  const run = async () => {
    const id = ++seq;
    const v = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      v[el.name] = el.type === 'number' ? parseFloat(el.value) : el.value;
      if (el.type === 'number' && Number.isNaN(v[el.name])) return msg('Completa todos los campos.');
    }
    try {
      const rows = await TOOLS[form.dataset.tool](v);
      if (id !== seq) return;
      if (!rows) return msg('Completa todos los campos.');
      out.replaceChildren(...rows.map(([k, val], i) => {
        const row = document.createElement('div');
        row.className = i ? 'row' : 'row main';
        const a = document.createElement('span');
        const b = document.createElement('strong');
        a.textContent = k;
        b.textContent = val;
        row.append(a, b);
        return row;
      }));
    } catch {
      if (id === seq) msg('No se pudo calcular. Revisa los datos e inténtalo de nuevo.');
    }
  };
  form.addEventListener('input', run);
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
  run();
});
