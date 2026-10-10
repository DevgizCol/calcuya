// Decodificador del Número Predial Nacional (NPN). Portado del plugin NPN Explorer (MIT, Albert Gaviria).
// Usa DANE (assets/dane.js). Todo se ejecuta en el navegador.
(() => {
  const COND = {
    0: 'No reglamentado en propiedad horizontal (No PH)',
    1: 'Servidumbre de tránsito o similar / condición especial',
    2: 'Predio informal (ocupación / posesión)',
    3: 'Bien de uso público diferente a vía',
    4: 'Vía pública',
    5: 'Mejora por edificación en terreno ajeno (no PH)',
    6: 'Mejora por edificación en terreno ajeno sometida a PH',
    7: 'Parque cementerio',
    8: 'PH con área de terreno común y privada (condominio / conjunto cerrado)',
    9: 'PH con área de terreno exclusivamente común (PH estándar)',
  };
  const strip = s => s.replace(/^0+/, '') || '0';
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function parse(raw) {
    const c = String(raw).replace(/\D/g, '');
    const r = { clean: c, valid: false, error: null, format: '', parts: [] };
    if (!c) return { ...r, error: 'El código está vacío.' };
    if (c.length !== 30 && c.length !== 22) return { ...r, error: `Longitud incorrecta (${c.length} dígitos). Debe tener 22 o 30.` };
    const dpto = c.slice(0, 2), zona = c.slice(5, 7);
    r.dpto = DANE.d[dpto];
    r.mpio = DANE.m[c.slice(0, 5)] || `Código ${c.slice(2, 5)} (municipio no indexado)`;
    r.zona = zona === '00' ? 'Rural' : zona === '01' ? 'Urbana (cabecera municipal)' : `Urbana, corregimiento ${zona}`;
    const mz = zona === '00' ? 'Vereda' : 'Manzana';
    const na = (code, text) => (/^0+$/.test(code) ? 'No aplica' : text);
    const base = [
      ['Departamento', '1-2', dpto, r.dpto || 'Desconocido'],
      ['Municipio', '3-5', c.slice(2, 5), r.mpio],
      ['Zona', '6-7', zona, r.zona],
    ];
    if (c.length === 30) {
      r.format = '30 dígitos';
      const [sector, comuna, barrio, manz, terr, cond, torre, piso, unidad] = [c.slice(7, 9), c.slice(9, 11), c.slice(11, 13), c.slice(13, 17), c.slice(17, 21), c[21], c.slice(22, 24), c.slice(24, 26), c.slice(26, 30)];
      r.parts = [...base,
        ['Sector', '8-9', sector, `Sector catastral ${sector}`],
        ['Comuna', '10-11', comuna, na(comuna, `Comuna o localidad ${comuna}`)],
        ['Barrio', '12-13', barrio, na(barrio, `Barrio catastral ${barrio}`)],
        [mz, '14-17', manz, `${mz} ${strip(manz)}`],
        ['Terreno', '18-21', terr, `Terreno ${strip(terr)}`],
        ['Condición', '22', cond, COND[cond]],
        ['Edificio o torre', '23-24', torre, na(torre, `Torre ${strip(torre)}`)],
        ['Piso', '25-26', piso, na(piso, `Piso ${strip(piso)}`)],
        ['Unidad', '27-30', unidad, na(unidad, `Unidad ${strip(unidad)}`)],
      ];
    } else {
      r.format = '22 dígitos (formato anterior)';
      const [sector, manz, terr, cond, cons] = [c.slice(7, 9), c.slice(9, 13), c.slice(13, 17), c[17], c.slice(18, 22)];
      r.parts = [...base,
        ['Sector', '8-9', sector, `Sector catastral ${sector}`],
        [mz, '10-13', manz, `${mz} ${strip(manz)}`],
        ['Terreno', '14-17', terr, `Terreno ${strip(terr)}`],
        ['Condición', '18', cond, COND[cond]],
        ['Construcción o unidad', '19-22', cons, na(cons, `Unidad constructiva ${strip(cons)}`)],
      ];
    }
    r.valid = !!r.dpto;
    if (!r.valid) r.error = `El código de departamento ${dpto} no existe en la división política de Colombia.`;
    return r;
  }

  // ---- Un predio
  const input = document.getElementById('npn');
  const out = document.getElementById('npn-out');
  const count = document.getElementById('npn-count');
  const render = () => {
    const r = parse(input.value);
    count.textContent = `${r.clean.length} dígitos`;
    if (!r.clean) return out.replaceChildren(el('p', 'muted', 'Pega o escribe un número predial para ver su desglose.'));
    if (!r.parts.length) return out.replaceChildren(el('p', 'npn-err', r.error));
    const segs = el('div', 'npn-segs');
    const table = el('table');
    const head = el('tr');
    head.append(el('th', null, 'Componente'), el('th', null, 'Posición'), el('th', null, 'Código'), el('th', null, 'Significado'));
    table.append(head);
    r.parts.forEach(([name, pos, code, desc], i) => {
      const seg = el('span', null, code);
      seg.title = name;
      seg.style.setProperty('--h', (i * 47) % 360);
      segs.append(seg);
      const tr = el('tr');
      const codeCell = el('td');
      const chip = el('b', null, code);
      chip.style.setProperty('--h', (i * 47) % 360);
      codeCell.append(chip);
      tr.append(el('td', null, name), el('td', null, pos), codeCell, el('td', null, desc));
      table.append(tr);
    });
    const main = el('div', 'row main');
    main.append(el('span', null, `NPN de ${r.format}`), el('strong', null, `${r.mpio}, ${r.dpto || 'departamento desconocido'}`));
    out.replaceChildren(main, segs, ...(r.error ? [el('p', 'npn-err', r.error)] : []), table);
  };
  input.addEventListener('input', render);
  document.getElementById('npn-demo').addEventListener('click', () => { input.value = '050010102030400050006901050502'; render(); });
  const shared = new URLSearchParams(location.search).get('npn');
  if (shared) input.value = shared.replace(/\D/g, '').slice(0, 30);
  render();

  // ---- Lote
  const COLS = ['NPN', 'Válido', 'Duplicado', 'Formato', 'Departamento', 'Municipio', 'Zona', 'Condición', 'Observación'];
  const lote = document.getElementById('lote');
  const loteOut = document.getElementById('lote-out');
  const csvBtn = document.getElementById('lote-csv');
  let rows = [];
  document.getElementById('lote-run').addEventListener('click', () => {
    const items = lote.value.split(/[\n,;\t]+/).map(s => s.trim()).filter(Boolean);
    const seen = new Map();
    items.forEach(s => { const c = s.replace(/\D/g, ''); seen.set(c, (seen.get(c) || 0) + 1); });
    rows = items.map(s => {
      const r = parse(s);
      const cond = r.parts.find(p => p[0] === 'Condición');
      return [r.clean || s, r.valid ? 'Sí' : 'No', seen.get(r.clean) > 1 ? 'Sí' : 'No', r.format, r.dpto || '', r.parts.length ? r.mpio : '', r.zona || '', cond ? cond[3] : '', r.error || ''];
    });
    csvBtn.hidden = !rows.length;
    if (!rows.length) return loteOut.replaceChildren(el('p', 'muted', 'Pega al menos un número predial.'));
    const bad = rows.filter(r => r[1] === 'No').length, dup = rows.filter(r => r[2] === 'Sí').length;
    const table = el('table');
    const head = el('tr');
    COLS.forEach(c => head.append(el('th', null, c)));
    table.append(head);
    rows.slice(0, 300).forEach(r => {
      const tr = el('tr', r[1] === 'No' ? 'bad' : r[2] === 'Sí' ? 'warn' : null);
      r.forEach(v => tr.append(el('td', null, v)));
      table.append(tr);
    });
    const wrap = el('div', 'scroll');
    wrap.append(table);
    loteOut.replaceChildren(
      el('p', null, `${rows.length} códigos analizados: ${rows.length - bad} válidos, ${bad} con error, ${dup} duplicados.${rows.length > 300 ? ' Se muestran los primeros 300; el CSV los incluye todos.' : ''}`),
      wrap,
    );
  });
  csvBtn.addEventListener('click', () => {
    // Las comillas y el prefijo de apóstrofo evitan que Excel convierta el NPN a notación científica o ejecute fórmulas
    const cell = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [COLS, ...rows.map(r => [`'${r[0]}`, ...r.slice(1)])].map(r => r.map(cell).join(';')).join('\r\n');
    const a = el('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'npn-validados.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();
