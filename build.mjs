// Generador estático de CalcuYa. Sin dependencias: `node build.mjs` crea ./dist
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import { ROOT, cfg, SITE, B, OUT, TODAY, YEAR, MONTH, fmt, num, esc, href, abs } from './src/core.mjs';
import { CURRENCIES, CO, AUX_INPUT, CO_NOTE, tools } from './src/calculadoras.mjs';
import { U, COMMON, kStr, linear, pairs, unit, vSlug, convUrl, hubUrl, convInputs, reverse, PCTS, BASES, pctUrl } from './src/unidades.mjs';

const urls = [];
const DANE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dane.json'), 'utf8'));
// Versión de los assets: cambia cuando cambia el código, para que el navegador no use copias en caché
const V = ['build.mjs', 'site.config.json', ...['src', 'data', 'static'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).map(f => path.join(d, f)))]
  .reduce((h, f) => h.update(fs.readFileSync(path.join(ROOT, f))), createHash('sha1')).digest('hex').slice(0, 8);

function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

// ---------------------------------------------------------------- plantilla
const slotAd = () => (cfg.ads?.slotHtml ? `<div class="ad">${cfg.ads.slotHtml}</div>` : '');

function affiliate(slug) {
  return (cfg.affiliates || [])
    .filter(a => a.enabled && (a.tools === '*' || a.tools.includes(slug)))
    .map(a => `<aside class="aff"><span>${esc(a.title)}</span><p>${esc(a.text)}</p><a href="${esc(a.url)}" rel="sponsored nofollow noopener" target="_blank">Ver más →</a></aside>`)
    .join('');
}

function page({ url, title, desc, body, crumbs = [], ld = [], index = true, scripts = [] }) {
  const trail = [['Inicio', '/'], ...crumbs];
  if (crumbs.length) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: trail.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(u) })),
    });
  }
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(url)}">
${index ? '' : '<meta name="robots" content="noindex">'}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
${cfg.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}">` : ''}
<meta name="theme-color" content="#0b6e4f">
<link rel="icon" href="${href('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${href('/assets/style.css')}?v=${V}">
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
${cfg.adsense?.client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(cfg.adsense.client)}" crossorigin="anonymous"></script>` : ''}
${cfg.ads?.headHtml || ''}
${cfg.analyticsHtml || ''}
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>
<header><div class="wrap"><a class="logo" href="${href('/')}">${LOGO}<span>${esc(cfg.siteName)}</span></a>
<nav aria-label="Principal">${CATS.map(c => `<a href="${href(catUrl(c))}"${url.startsWith(catUrl(c)) || crumbs[0]?.[1] === catUrl(c) ? ' aria-current="true"' : ''}>${c.name.split(' ')[0]}</a>`).join('')}</nav></div></header>
<main class="wrap" id="contenido">
<p class="print-only">${esc(cfg.siteName)} · ${abs(url)} · <span id="print-date"></span></p>
${crumbs.length ? `<p class="crumbs">${trail.map(([n, u], i) => (i < trail.length - 1 ? `<a href="${href(u)}">${esc(n)}</a>` : esc(n))).join(' › ')}</p>` : ''}
${body}
<p class="print-only">Cálculo orientativo generado en ${esc(cfg.siteName)}. No es un documento oficial ni reemplaza la liquidación de un empleador, una entidad o un profesional.</p>
</main>
<footer><div class="wrap cols">
<div><a class="logo" href="${href('/')}">${LOGO}<span>${esc(cfg.siteName)}</span></a><p class="muted">${esc(cfg.tagline)}.</p></div>
<div><strong>Más usadas</strong>${tools.filter(t => ['prima-de-servicios-colombia', 'liquidacion-colombia', 'interes-compuesto', 'prestamo', 'iva'].includes(t.slug)).map(t => `<a href="${href(toolUrl(t))}">${esc(cap(shortName(t)))}</a>`).join('')}</div>
<div><strong>Categorías</strong>${CATS.map(c => `<a href="${href(catUrl(c))}">${c.name}</a>`).join('')}<a href="${href('/convertir/')}">Conversores de unidades</a><a href="${href('/porcentaje/')}">Tablas de porcentajes</a></div>
<div><strong>${esc(cfg.siteName)}</strong><a href="${href('/acerca/')}">Acerca de</a><a href="${href('/contacto/')}">Contacto</a><a href="${href('/privacidad/')}">Privacidad</a><a href="${href('/terminos/')}">Términos</a></div>
</div><div class="wrap"><p class="muted">© ${YEAR} ${esc(cfg.siteName)}. Los resultados son orientativos y no constituyen asesoría financiera, fiscal, legal ni médica.</p></div></footer>
<script src="${href('/assets/tools.js')}?v=${V}" defer></script>
<script src="${href('/assets/app.js')}?v=${V}" defer></script>
${scripts.map(f => `<script src="${href(`/assets/${f}`)}?v=${V}" defer></script>`).join('\n')}
</body>
</html>`;
  write(path.join(url, 'index.html'), html);
  if (index) urls.push(url);
}

const LOGO = '<svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor"/><path d="M20 22h24M20 32h24M20 42h12" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>';
const MONEY = new Set(['capital', 'aporte', 'monto', 'salario', 'meta', 'inicial', 'precio', 'cuenta']);

function form(tool, inputs, over = {}, { persist = false } = {}) {
  const fields = inputs.map(i => {
    const val = over[i.id] ?? i.value ?? '';
    if (i.type === 'hidden') return `<input type="hidden" name="${i.id}" value="${esc(val)}">`;
    // "Tasa (%)" → etiqueta "Tasa" con la unidad dentro del campo
    const [, label, suf] = i.label.match(/^(.*) \((%|kg|cm|meses)\)$/) || [, i.label, ''];
    const money = MONEY.has(i.id) && tool !== 'conversor-de-divisas';
    const ctl = i.type === 'select'
      ? `<select name="${i.id}">${i.options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`
      : i.type === 'date'
        ? `<input type="date" name="${i.id}"${i.today ? ' data-today' : ''}>`
        : `<span class="field">${money ? '<i>$</i>' : ''}<input type="number" inputmode="decimal" step="any" name="${i.id}" value="${esc(val)}"${money ? ' data-money' : ''}>${suf ? `<i>${suf}</i>` : ''}</span>${money ? '<small class="hint"></small>' : ''}`;
    return `<label><span>${esc(label)}</span>${ctl}</label>`;
  }).join('');
  return `<div class="calc"><form data-tool="${tool}"${persist ? ' data-persist' : ''} novalidate>${fields}</form>
<div class="result" aria-live="polite"></div>
<div class="actions" hidden><button type="button" data-act="copy">Copiar resultado</button><button type="button" data-act="share">Compartir enlace</button><button type="button" data-act="print">Guardar PDF</button><a data-act="wa" target="_blank" rel="noopener">Enviar por WhatsApp</a></div>
<ul class="trust"><li>Gratis y sin registro</li><li>Lo que escribes no sale de tu dispositivo</li><li>Revisada en ${MONTH}</li></ul></div>`;
}

const faqHtml = faq => (faq?.length ? `<h2>Preguntas frecuentes</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}` : '');
const faqLd = faq => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

// ===================================================================== build
fs.rmSync(OUT, { recursive: true, force: true });
const toolUrl = t => `/${t.slug}/`;
const shortName = t => t.name.replace(/^Calculadora de /, '').replace(/ \d{4}/, '').replace(/ \((Colombia|México)\)/, '');
const country = t => (t.name.match(/\((Colombia|México)\)/) || [])[1];
const cap = s => s[0].toUpperCase() + s.slice(1);
const toolCards = list => `<div class="grid">${list.map(t => `<a class="card" href="${href(toolUrl(t))}" data-search="${esc(`${t.name} ${t.desc}`)}"><span class="ico" aria-hidden="true">${t.icon}</span><strong>${esc(cap(shortName(t)))}</strong>${country(t) ? `<em class="chip">${country(t)}</em>` : ''}<span class="muted">${esc(t.intro)}</span></a>`).join('')}</div>`;

// Herramienta de catastro (su página se genera más abajo, con plantilla propia)
const NPN = {
  slug: 'catastro/numero-predial-nacional', group: 'catastro', icon: '🗺️',
  name: 'Decodificador de número predial nacional (NPN)',
  desc: 'Decodifica y valida el número predial nacional (NPN) de 30 o 22 dígitos de Colombia: departamento, municipio, zona, manzana, terreno, condición y unidad. Valida lotes completos y descarga el resultado en CSV.',
  intro: 'Desglosa y valida números prediales de 30 o 22 dígitos, uno a uno o por lotes, sin instalar nada.',
};

// Categorías: ordenan el menú, las migas de pan, la portada y las páginas índice
const UTIL = ['imc', 'regla-de-tres', 'propina', 'dias-entre-fechas', 'edad'];
const CATS = [
  { id: 'salario', name: 'Salario y trabajo', lead: `Prima, cesantías, liquidación, salario neto y horas extras con los valores legales de ${YEAR}.` },
  { id: 'finanzas', name: 'Finanzas personales', lead: 'Ahorro, créditos, impuestos y descuentos, con la fórmula explicada.' },
  { id: 'catastro', name: 'Catastro y SIG', lead: 'Herramientas gratuitas para profesionales del catastro en Colombia.' },
  { id: 'utilidades', name: 'Utilidades', lead: 'Salud, fechas, proporciones y conversiones de unidades para el día a día.' },
];
const ALL = [...tools, NPN];
const catUrl = c => `/${c.id}/`;
const catOf = t => CATS.find(c => c.id === (t.group === 'laboral' ? 'salario' : t.group === 'catastro' ? 'catastro' : UTIL.includes(t.slug) ? 'utilidades' : 'finanzas'));
const inCat = c => ALL.filter(t => catOf(t) === c);
const toolCrumbs = t => [[catOf(t).name, catUrl(catOf(t))], [cap(shortName(t)), toolUrl(t)]];
const moreInCat = t => `<section class="noprint"><h2>Más en ${catOf(t).name.toLowerCase()}</h2>${toolCards(inCat(catOf(t)).filter(o => o !== t).slice(0, 6))}
<p><a href="${href(catUrl(catOf(t)))}">Ver todas las herramientas de ${catOf(t).name.toLowerCase()} →</a></p></section>`;
const SERVICES = `<aside class="aff"><span>Servicios profesionales · DGZ Engineering Lab</span><p>¿Necesitas validar o depurar una base catastral completa, cruzar catastro con registro o automatizar tareas en QGIS? Hacemos trabajos a medida: control de calidad LADM-COL, scripts y complementos, y visores web.</p><a href="mailto:${esc(cfg.contactEmail)}?subject=Consulta%20sobre%20servicios%20de%20catastro%20y%20SIG">Cuéntanos tu caso →</a></aside>`;

// Calculadoras
for (const t of tools) {
  page({
    url: toolUrl(t), title: `${t.name} online gratis | ${cfg.siteName}`, desc: t.desc,
    crumbs: toolCrumbs(t),
    ld: [
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, url: abs(toolUrl(t)), description: t.desc, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'es', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      ...(t.faq.length ? [faqLd(t.faq)] : []),
    ],
    body: `<h1>${esc(t.name)}</h1><p class="lead">${esc(t.intro)}</p>
${form(t.slug, t.inputs, {}, { persist: true })}
<div hidden id="tool-meta" data-href="${href(toolUrl(t))}" data-icon="${t.icon}" data-name="${esc(cap(shortName(t)))}"></div>
${affiliate(t.slug)}
<article>${t.article}${faqHtml(t.faq)}</article>
${slotAd()}
${moreInCat(t)}`,
  });
}

// ------------------------------------------------------------- catastro (Colombia)
const npnFaq = [
  ['¿Qué es el número predial nacional?', 'Es el código de 30 dígitos que identifica de forma única cada predio en el catastro colombiano. Su estructura indica la ubicación del predio (departamento, municipio, zona, sector, comuna, barrio, manzana o vereda), el terreno, su condición jurídica y, en propiedad horizontal, el edificio, el piso y la unidad.'],
  ['¿Qué diferencia hay entre el NPN de 30 dígitos y el de 22?', 'El de 22 dígitos es el formato anterior: no incluye comuna ni barrio, y agrupa la construcción en un solo bloque de cuatro dígitos. Muchas bases de datos y documentos antiguos aún lo usan.'],
  ['¿Qué significa el dígito 22, la condición del predio?', 'Indica el tipo de predio: por ejemplo, 0 para un predio no sometido a propiedad horizontal, 8 para condominios y 9 para propiedad horizontal. La tabla completa está más abajo en esta página.'],
  ['¿Se envían mis códigos a algún servidor?', 'No. El análisis se hace por completo en tu navegador; los números que pegas no salen de tu dispositivo.'],
];
page({
  url: toolUrl(NPN), title: `Decodificador de número predial nacional (NPN) de Colombia | ${cfg.siteName}`, desc: NPN.desc,
  crumbs: toolCrumbs(NPN),
  scripts: ['dane.js', 'npn.js'],
  ld: [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: NPN.name, url: abs(toolUrl(NPN)), description: NPN.desc, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'es', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    faqLd(npnFaq),
  ],
  body: `<h1>Decodificador de número predial nacional (NPN)</h1>
<p class="lead">Pega un número predial de 30 o 22 dígitos y obtén su desglose completo: ubicación, terreno, condición del predio y unidad. También puedes validar un lote entero y descargarlo en CSV.</p>
<div class="calc">
<label><span>Número predial <small id="npn-count" class="muted"></small></span>
<span class="field"><input id="npn" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="45" placeholder="Ej.: 050010102030400050006901050502"></span></label>
<div class="actions"><button type="button" id="npn-demo">Ver un ejemplo</button></div>
<div class="result" id="npn-out" aria-live="polite"></div>
<ul class="trust"><li>Gratis y sin registro</li><li>Los códigos no salen de tu dispositivo</li><li>${Object.keys(DANE.m).length} municipios indexados</li></ul>
</div>
<h2 id="lote">Validar un lote de números prediales</h2>
<p>Pega una columna de Excel o una lista separada por saltos de línea, comas o punto y coma. Detecta longitudes incorrectas, departamentos inexistentes y códigos duplicados.</p>
<div class="calc">
<label><span>Lista de números prediales</span><textarea id="lote" rows="6" spellcheck="false" placeholder="Un número predial por línea"></textarea></label>
<div class="actions"><button type="button" id="lote-run" class="primary">Analizar lote</button><button type="button" id="lote-csv" hidden>Descargar CSV</button></div>
<div class="result" id="lote-out" aria-live="polite"></div>
</div>
<div hidden id="tool-meta" data-href="${href(toolUrl(NPN))}" data-icon="${NPN.icon}" data-name="Número predial nacional"></div>
${SERVICES}
<article>
<h2>Estructura del NPN de 30 dígitos</h2>
<table><tr><th>Posición</th><th>Componente</th><th>Dígitos</th></tr>
<tr><td>1-2</td><td>Departamento (código DANE)</td><td>2</td></tr><tr><td>3-5</td><td>Municipio (código DANE)</td><td>3</td></tr>
<tr><td>6-7</td><td>Zona: 00 rural, 01 urbana, 02 en adelante corregimientos</td><td>2</td></tr><tr><td>8-9</td><td>Sector</td><td>2</td></tr>
<tr><td>10-11</td><td>Comuna</td><td>2</td></tr><tr><td>12-13</td><td>Barrio</td><td>2</td></tr>
<tr><td>14-17</td><td>Manzana (urbano) o vereda (rural)</td><td>4</td></tr><tr><td>18-21</td><td>Terreno</td><td>4</td></tr>
<tr><td>22</td><td>Condición del predio</td><td>1</td></tr><tr><td>23-24</td><td>Edificio o torre</td><td>2</td></tr>
<tr><td>25-26</td><td>Piso</td><td>2</td></tr><tr><td>27-30</td><td>Unidad predial</td><td>4</td></tr></table>
<h2>Condición del predio (dígito 22)</h2>
<table><tr><th>Código</th><th>Significado</th></tr>
<tr><td>0</td><td>No reglamentado en propiedad horizontal (No PH)</td></tr><tr><td>1</td><td>Servidumbre de tránsito o condición especial</td></tr>
<tr><td>2</td><td>Predio informal (ocupación o posesión)</td></tr><tr><td>3</td><td>Bien de uso público diferente a vía</td></tr>
<tr><td>4</td><td>Vía pública</td></tr><tr><td>5</td><td>Mejora por edificación en terreno ajeno (no PH)</td></tr>
<tr><td>6</td><td>Mejora por edificación en terreno ajeno sometida a PH</td></tr><tr><td>7</td><td>Parque cementerio</td></tr>
<tr><td>8</td><td>PH con área de terreno común y privada (condominio)</td></tr><tr><td>9</td><td>PH con área de terreno exclusivamente común</td></tr></table>
<h2>Estructura del formato anterior de 22 dígitos</h2>
<p>Departamento (2), municipio (3), zona (2), sector (2), manzana o vereda (4), terreno (4), condición (1) y construcción o unidad (4).</p>
<p class="muted">Esta herramienta valida la estructura del código, no la existencia del predio en la base catastral. Para información oficial consulta al gestor catastral de tu municipio o al IGAC. La lógica proviene del complemento libre <a href="https://github.com/DGZ-Engineering-Lab/NPN_Explorer" rel="noopener">NPN Explorer para QGIS</a>.</p>
${faqHtml(npnFaq)}</article>
${slotAd()}
${moreInCat(NPN)}`,
});

// Páginas índice de cada categoría
const HUB_EXTRA = {
  finanzas: () => `<h2>Tablas de porcentajes</h2><p>Consulta resultados ya calculados, como el 15% de 200 o el 19% de 1.000, en las <a href="${href('/porcentaje/')}">tablas de porcentajes</a>.</p>`,
  utilidades: () => `<h2>Conversores de unidades</h2>
<p class="links">${pairs.map(p => `<a href="${href(hubUrl(p))}">${U[p.from][1]} a ${U[p.to][1]}</a>`).join('')}</p>`,
  catastro: () => `${SERVICES}
<h2>Software libre para QGIS</h2>
<div class="grid">
<a class="card" href="https://github.com/DGZ-Engineering-Lab/NPN_Explorer" rel="noopener"><strong>NPN Explorer</strong><span class="muted">Complemento de QGIS para desglosar el número predial y contrastar catastro con registro.</span></a>
<a class="card" href="https://github.com/DGZ-Engineering-Lab/qgdb" rel="noopener"><strong>QGDB</strong><span class="muted">Geodatabases jerárquicas en QGIS, con conversión desde File Geodatabase y perfil LADM-COL.</span></a>
<a class="card" href="https://github.com/DGZ-Engineering-Lab/E.V.A" rel="noopener"><strong>E.V.A.</strong><span class="muted">Valoración de activos forestales e indexación por IPC para peritos avaluadores.</span></a>
</div>`,
};
for (const c of CATS) {
  page({
    url: catUrl(c), title: `${c.name}: calculadoras y herramientas gratis | ${cfg.siteName}`, desc: c.lead,
    crumbs: [[c.name, catUrl(c)]],
    body: `<h1>${c.name}</h1><p class="lead">${c.lead}</p>
${toolCards(inCat(c))}
${HUB_EXTRA[c.id]?.() || ''}
${slotAd()}`,
  });
}

// Conversores: página por par + página por valor
for (const p of pairs) {
  const rev = reverse(p);
  const [fromP, toP] = [U[p.from][1], U[p.to][1]];
  const Fp = fromP[0].toUpperCase() + fromP.slice(1);
  const row = v => `<tr><td><a href="${href(convUrl(p, v))}">${fmt(v)} ${U[p.from][3]}</a></td><td>${num(p.conv(v))} ${U[p.to][3]}</td></tr>`;
  const one = `1 ${unit(p.from, 1)} equivale a ${num(p.conv(1))} ${toP}`;
  const faq = [
    [`¿Cómo se convierten ${fromP} a ${toP}?`, `Aplica la fórmula ${p.formula}.`],
    [`¿Cuánto es 1 ${unit(p.from, 1)} en ${toP}?`, `${one}.`],
  ];
  page({
    url: hubUrl(p), title: `Convertir ${fromP} a ${toP} (${U[p.from][3]} a ${U[p.to][3]}) | ${cfg.siteName}`,
    desc: `Conversor de ${fromP} a ${toP} con fórmula, ejemplos y tabla de equivalencias. ${one}.`,
    crumbs: [['Conversores', '/convertir/'], [`${Fp} a ${toP}`, hubUrl(p)]],
    ld: [faqLd(faq)],
    body: `<h1>Convertir ${esc(fromP)} a ${esc(toP)}</h1>
<p class="lead">Escribe un valor en ${esc(fromP)} y obtén al instante su equivalencia en ${esc(toP)}.</p>
${form('conv', convInputs(p))}
<article><h2>Fórmula</h2><p><strong>${p.formula}</strong>. ${one}.</p>
<h2>Tabla de ${esc(fromP)} a ${esc(toP)}</h2>
<table><tr><th>${Fp}</th><th>${toP[0].toUpperCase() + toP.slice(1)}</th></tr>${p.vals.map(row).join('')}</table>
<p>¿Necesitas la conversión inversa? Usa el conversor de <a href="${href(hubUrl(rev))}">${U[rev.from][1]} a ${U[rev.to][1]}</a>.</p>
${faqHtml(faq)}</article>
${slotAd()}`,
  });

  p.vals.forEach((v, idx) => {
    const r = p.conv(v);
    const q = `${fmt(v)} ${unit(p.from, v)}`;
    const ans = `${num(r)} ${unit(p.to, r)}`;
    const near = p.vals.slice(Math.max(0, idx - 4), idx + 5).filter(x => x !== v);
    const step = p.pre || p.post
      ? `Sustituyendo en la fórmula ${p.formula} con el valor ${fmt(v)}, el resultado es ${num(r)}.`
      : `${fmt(v)} ${p.op} = ${num(r)}.`;
    page({
      url: convUrl(p, v), title: `${q} a ${toP}: ¿cuánto es? | ${cfg.siteName}`,
      desc: `${q} equivalen a ${ans}. Fórmula paso a paso, tabla de valores cercanos y conversor de ${fromP} a ${toP}.`,
      crumbs: [['Conversores', '/convertir/'], [`${Fp} a ${toP}`, hubUrl(p)], [q, convUrl(p, v)]],
      ld: [faqLd([[`¿Cuánto son ${q} en ${toP}?`, `${q} equivalen a ${ans}.`]])],
      body: `<h1>¿Cuánto son ${esc(q)} en ${esc(toP)}?</h1>
<p class="answer">${esc(q)} = <strong>${esc(ans)}</strong></p>
${form('conv', convInputs(p), { valor: v })}
<article><h2>Cómo se calcula</h2><p>La fórmula para pasar de ${esc(fromP)} a ${esc(toP)} es <strong>${p.formula}</strong>.</p><p>${step}</p>
<h2>Valores cercanos</h2>
<table><tr><th>${Fp}</th><th>${toP[0].toUpperCase() + toP.slice(1)}</th></tr>${near.map(row).join('')}</table>
<p>Consulta la <a href="${href(hubUrl(p))}">tabla completa de ${esc(fromP)} a ${esc(toP)}</a> o la conversión inversa: <a href="${href(hubUrl(rev))}">${U[rev.from][1]} a ${U[rev.to][1]}</a>.</p></article>
${slotAd()}`,
    });
  });
}
page({
  url: '/convertir/', title: `Conversores de unidades online | ${cfg.siteName}`,
  desc: 'Conversores de unidades gratis: libras a kilos, pulgadas a centímetros, millas a kilómetros, Fahrenheit a Celsius y más.',
  crumbs: [['Conversores', '/convertir/']],
  body: `<h1>Conversores de unidades</h1><p class="lead">Peso, longitud, volumen y temperatura. Elige un conversor:</p>
<div class="grid">${pairs.map(p => `<a class="card" href="${href(hubUrl(p))}"><strong>${U[p.from][1]} → ${U[p.to][1]}</strong><span class="muted">${U[p.from][3]} a ${U[p.to][3]}</span></a>`).join('')}</div>`,
});

// Porcentajes
const pctInputs = tools.find(t => t.slug === 'porcentajes').inputs;
for (const p of PCTS) for (const b of BASES) {
  const r = (b * p) / 100;
  page({
    url: pctUrl(p, b), title: `¿Cuánto es el ${p}% de ${fmt(b)}? | ${cfg.siteName}`,
    desc: `El ${p}% de ${fmt(b)} es ${fmt(r)}. Te explicamos el cálculo paso a paso y cuánto es ${fmt(b)} más y menos el ${p}%.`,
    crumbs: [['Porcentajes', '/porcentaje/'], [`${p}% de ${fmt(b)}`, pctUrl(p, b)]],
    ld: [faqLd([[`¿Cuánto es el ${p}% de ${fmt(b)}?`, `El ${p}% de ${fmt(b)} es ${fmt(r)}.`]])],
    body: `<h1>¿Cuánto es el ${p}% de ${fmt(b)}?</h1>
<p class="answer">El ${p}% de ${fmt(b)} es <strong>${fmt(r)}</strong></p>
${form('porcentajes', pctInputs, { pct: p, cantidad: b })}
<article><h2>Cálculo paso a paso</h2>
<p>Multiplica la cantidad por el porcentaje y divide entre 100: ${fmt(b)} × ${p} ÷ 100 = <strong>${fmt(r)}</strong>.</p>
<ul><li>${fmt(b)} más el ${p}% = <strong>${fmt(b + r)}</strong> (por ejemplo, al añadir un impuesto o un aumento).</li>
<li>${fmt(b)} menos el ${p}% = <strong>${fmt(b - r)}</strong> (por ejemplo, al aplicar un descuento).</li></ul>
<h2>Otros porcentajes de ${fmt(b)}</h2>
<table><tr><th>Porcentaje</th><th>Resultado</th></tr>${PCTS.filter(x => x !== p).map(x => `<tr><td><a href="${href(pctUrl(x, b))}">${x}% de ${fmt(b)}</a></td><td>${fmt((b * x) / 100)}</td></tr>`).join('')}</table>
<h2>El ${p}% de otras cantidades</h2>
<table><tr><th>Cantidad</th><th>${p}%</th></tr>${BASES.filter(x => x !== b).map(x => `<tr><td><a href="${href(pctUrl(p, x))}">${p}% de ${fmt(x)}</a></td><td>${fmt((x * p) / 100)}</td></tr>`).join('')}</table></article>
${slotAd()}`,
  });
}
page({
  url: '/porcentaje/', title: `Tablas de porcentajes: ¿cuánto es el X% de Y? | ${cfg.siteName}`,
  desc: 'Consulta al instante cuánto es el 5%, 10%, 15%, 20%, 25% o 50% de las cantidades más buscadas, con el cálculo explicado.',
  crumbs: [['Porcentajes', '/porcentaje/']],
  body: `<h1>Tablas de porcentajes</h1><p class="lead">Elige un porcentaje y una cantidad, o usa la <a href="${href('/porcentajes/')}">calculadora de porcentajes</a> para cualquier valor.</p>
${PCTS.map(p => `<h2>${p}%</h2><p class="links">${BASES.map(b => `<a href="${href(pctUrl(p, b))}">${p}% de ${fmt(b)}</a>`).join('')}</p>`).join('')}`,
});

// Inicio
page({
  url: '/', title: `${cfg.siteName}: ${cfg.tagline}`,
  desc: 'Calculadoras online gratis en español: interés compuesto, préstamos, IVA, porcentajes, IMC, conversor de divisas y de unidades. Sin registro.',
  ld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.siteName, url: abs('/'), inLanguage: 'es' }],
  body: `<section class="hero"><h1>Haz tus cuentas en segundos</h1>
<p class="lead">Calculadoras claras para tu salario, tus ahorros, tus créditos y tu día a día. Gratis, sin registro y con la fórmula explicada.</p>
<label class="search"><span class="sr">Buscar calculadora</span><input type="search" id="q" placeholder="¿Qué quieres calcular? Ej.: prima, préstamo, IVA…" autocomplete="off"></label>
<p class="links">${['prima-de-servicios-colombia', 'liquidacion-colombia', 'salario-neto-colombia', 'interes-compuesto', 'prestamo', 'iva'].map(sl => tools.find(t => t.slug === sl)).map(t => `<a href="${href(toolUrl(t))}">${esc(cap(shortName(t)))}</a>`).join('')}</p></section>
<section id="recientes" hidden><h2>Continúa donde lo dejaste</h2><div class="grid"></div></section>
<p id="noresults" class="muted" hidden>No encontramos esa calculadora. Prueba con otra palabra o revisa los <a href="${href('/convertir/')}">conversores de unidades</a>.</p>
${CATS.map(c => `<section><div class="sec-head"><h2>${c.name}</h2><a href="${href(catUrl(c))}">Ver todo →</a></div><p class="muted">${c.lead}</p>${toolCards(inCat(c))}</section>`).join('\n')}
<section class="why"><div><strong>Claras</strong><p>Cada resultado viene con su fórmula y un ejemplo, para que entiendas de dónde sale el número.</p></div>
<div><strong>Privadas</strong><p>Los cálculos se hacen en tu dispositivo. No pedimos correo ni registro.</p></div>
<div><strong>Al día</strong><p>Las calculadoras laborales usan los valores legales de ${YEAR} y se revisan cada año.</p></div></section>
${slotAd()}`,
});

// Páginas legales (requeridas por las redes de anuncios)
const legal = (url, title, body) => page({ url, title: `${title} | ${cfg.siteName}`, desc: `${title} de ${cfg.siteName}.`, crumbs: [[title, url]], body: `<article><h1>${title}</h1>${body}</article>` });
legal('/acerca/', 'Acerca de', `<p>${esc(cfg.siteName)} es un proyecto independiente que ofrece calculadoras y conversores gratuitos en español. Todas las herramientas funcionan directamente en tu navegador: los datos que introduces no se envían ni se almacenan en ningún servidor.</p><p>Nos financiamos mediante publicidad y, en algunos casos, enlaces de afiliados claramente identificados. Si encuentras un error o quieres proponer una calculadora, <a href="${href('/contacto/')}">escríbenos</a>.</p>`);
legal('/contacto/', 'Contacto', `<p>Para sugerencias, correcciones o consultas comerciales escribe a <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>.</p>`);
legal('/terminos/', 'Términos de uso', `<p>El uso de ${esc(cfg.siteName)} es gratuito. Los resultados de las calculadoras son orientativos y se ofrecen "tal cual", sin garantía de exactitud. No constituyen asesoría financiera, fiscal, legal ni médica. Verifica siempre los cálculos importantes con un profesional o con la entidad correspondiente.</p><p>Algunos enlaces pueden ser de afiliados: si contratas un producto a través de ellos podemos recibir una comisión sin costo adicional para ti.</p><p>Última actualización: ${TODAY}.</p>`);
legal('/privacidad/', 'Política de privacidad', `<p>Las calculadoras de ${esc(cfg.siteName)} se ejecutan en tu navegador. No recopilamos ni almacenamos los valores que introduces, y no es necesario registrarse.</p>
<h2>Cookies y publicidad</h2><p>Este sitio puede mostrar anuncios de terceros, incluido Google. Estos proveedores utilizan cookies para mostrar anuncios basados en tus visitas anteriores a este y a otros sitios web. Puedes inhabilitar la publicidad personalizada de Google en <a href="https://adssettings.google.com" rel="nofollow noopener">adssettings.google.com</a> y la de otros proveedores en <a href="https://www.aboutads.info/choices/" rel="nofollow noopener">aboutads.info</a>.</p>
<h2>Estadísticas</h2><p>Podemos usar herramientas de analítica para conocer de forma agregada qué páginas se visitan. Estos datos no nos permiten identificarte personalmente.</p>
<h2>Servicios externos</h2><p>El conversor de divisas consulta los tipos de cambio a un servicio externo (Exchange Rate API), que recibe tu dirección IP como en cualquier petición web.</p>
<h2>Contacto</h2><p>Para cualquier consulta sobre privacidad escribe a <a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>.</p><p>Última actualización: ${TODAY}.</p>`);

// 404 (ruta fija en la raíz, fuera del sitemap)
page({ url: '/404/', index: false, title: `Página no encontrada | ${cfg.siteName}`, desc: 'Página no encontrada.', body: `<h1>Página no encontrada</h1><p class="lead">Prueba con alguna de nuestras calculadoras:</p>${toolCards(tools)}` });
fs.copyFileSync(path.join(OUT, '404', 'index.html'), path.join(OUT, '404.html'));

// ------------------------------------------------------------------- assets
const CONV = Object.fromEntries(pairs.map(p => [p.slug, { k: p.k, pre: p.pre, post: p.post, from: U[p.from][3], to: U[p.to][3] }]));
write('assets/tools.js', `const fmt=(n,d=2)=>Number(n).toLocaleString('es',{maximumFractionDigits:d,useGrouping:'always'});
const CONV=${JSON.stringify(CONV)};
const CO=${JSON.stringify(CO)};
const coAux=(salario,aux)=>aux==='si'||(aux==='auto'&&salario<=2*CO.smmlv)?CO.aux:0;
const cop=n=>'$ '+fmt(n,0);
const TOOLS={${tools.map(t => `${JSON.stringify(t.slug)}:${t.calc.toString()}`).join(',\n')},
conv:({valor,par})=>{const c=CONV[par];return [[fmt(valor,4)+' '+c.from+' =',fmt((valor+c.pre)*c.k+c.post,4)+' '+c.to]];}};
`);
for (const f of fs.readdirSync(path.join(ROOT, 'static'))) fs.copyFileSync(path.join(ROOT, 'static', f), path.join(OUT, 'assets', f));

write('assets/dane.js', `const DANE=${JSON.stringify(DANE)};`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${abs(u)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
if (cfg.adsense?.client) write('ads.txt', `google.com, ${cfg.adsense.client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
// Archivos que deben quedar en la raíz del sitio (verificaciones de buscadores, etc.)
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
write('.nojekyll', '');

console.log(`✔ ${urls.length} páginas generadas en dist/ para ${SITE}`);
if (/TU-USUARIO/.test(SITE)) console.warn('⚠ Falta configurar "siteUrl" en site.config.json');
if (/ejemplo\.com/.test(cfg.contactEmail)) console.warn('⚠ Falta configurar "contactEmail" en site.config.json');
