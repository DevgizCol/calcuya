// Generador estático de CalcuYa. Sin dependencias: `node build.mjs` crea ./dist
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const SITE = (process.env.SITE_URL || cfg.siteUrl).replace(/\/$/, '');
const B = new URL(SITE).pathname.replace(/\/$/, '');
const OUT = path.join(ROOT, 'dist');
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = TODAY.slice(0, 4);

const fmt = (n, d = 2) => Number(n).toLocaleString('es', { maximumFractionDigits: d, useGrouping: 'always' });
const num = n => { const a = Math.abs(n); return fmt(n, a >= 100 ? 2 : a >= 1 ? 3 : 5); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const href = p => B + p;
const abs = p => SITE + p;
const urls = [];

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

function page({ url, title, desc, body, crumbs = [], ld = [], index = true }) {
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
<link rel="icon" href="${href('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${href('/assets/style.css')}">
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
${cfg.adsense?.client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(cfg.adsense.client)}" crossorigin="anonymous"></script>` : ''}
${cfg.ads?.headHtml || ''}
${cfg.analyticsHtml || ''}
</head>
<body>
<header><div class="wrap"><a class="logo" href="${href('/')}">${esc(cfg.siteName)}</a>
<nav><a href="${href('/#calculadoras')}">Calculadoras</a><a href="${href('/convertir/')}">Conversores</a><a href="${href('/porcentaje/')}">Porcentajes</a></nav></div></header>
<main class="wrap">
${crumbs.length ? `<p class="crumbs">${trail.map(([n, u], i) => (i < trail.length - 1 ? `<a href="${href(u)}">${esc(n)}</a>` : esc(n))).join(' › ')}</p>` : ''}
${body}
</main>
<footer><div class="wrap"><p>© ${YEAR} ${esc(cfg.siteName)} · ${esc(cfg.tagline)}</p>
<p><a href="${href('/acerca/')}">Acerca de</a> · <a href="${href('/privacidad/')}">Privacidad</a> · <a href="${href('/terminos/')}">Términos</a> · <a href="${href('/contacto/')}">Contacto</a></p>
<p class="muted">Los resultados son orientativos y no constituyen asesoría financiera, fiscal ni médica.</p></div></footer>
<script src="${href('/assets/tools.js')}" defer></script>
<script src="${href('/assets/app.js')}" defer></script>
</body>
</html>`;
  write(path.join(url, 'index.html'), html);
  if (index) urls.push(url);
}

function form(tool, inputs, over = {}) {
  const fields = inputs.map(i => {
    const val = over[i.id] ?? i.value ?? '';
    if (i.type === 'hidden') return `<input type="hidden" name="${i.id}" value="${esc(val)}">`;
    const ctl = i.type === 'select'
      ? `<select name="${i.id}">${i.options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`
      : i.type === 'date'
        ? `<input type="date" name="${i.id}"${i.today ? ' data-today' : ''}>`
        : `<input type="number" inputmode="decimal" step="any" name="${i.id}" value="${esc(val)}">`;
    return `<label>${esc(i.label)}${ctl}</label>`;
  }).join('');
  return `<div class="calc"><form data-tool="${tool}">${fields}</form><div class="result" aria-live="polite"></div></div>`;
}

const faqHtml = faq => (faq?.length ? `<h2>Preguntas frecuentes</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}` : '');
const faqLd = faq => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

// ------------------------------------------------------------- calculadoras
// `calc` se ejecuta en el navegador (se serializa a assets/tools.js): solo puede usar `fmt`.
const CURRENCIES = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'BRL', 'UYU', 'BOB', 'PYG', 'DOP', 'GTQ', 'CRC', 'VES', 'GBP', 'CAD', 'JPY'].map(c => [c, c]);

// Colombia: SMMLV y auxilio de transporte 2026 (Decretos 1469 y 1470 de 2025). Actualizar cada enero.
const CO = { smmlv: 1750905, aux: 249095 };
const AUX_INPUT = { id: 'aux', label: 'Auxilio de transporte', type: 'select', value: 'auto', options: [['auto', 'Automático (si gana hasta 2 salarios mínimos)'], ['si', 'Sí recibe'], ['no', 'No recibe']] };
const CO_NOTE = `<p class="muted">Valores ${YEAR}: salario mínimo $ ${fmt(CO.smmlv)} y auxilio de transporte $ ${fmt(CO.aux)}. Cálculo orientativo: no reemplaza la liquidación oficial de tu empleador ni la asesoría de un contador o abogado laboral.</p>`;

const tools = [
  {
    slug: 'interes-compuesto', icon: '📈', name: 'Calculadora de interés compuesto',
    desc: 'Calcula cuánto crecerá tu dinero con interés compuesto y aportes mensuales. Gratis, al instante y sin registro.',
    intro: 'Descubre cuánto valdrá tu inversión en el futuro combinando un capital inicial, aportes mensuales y una tasa de interés anual.',
    inputs: [
      { id: 'capital', label: 'Capital inicial', value: 1000 },
      { id: 'aporte', label: 'Aporte mensual', value: 100 },
      { id: 'tasa', label: 'Tasa de interés anual (%)', value: 8 },
      { id: 'anios', label: 'Años', value: 10 },
    ],
    calc: ({ capital, aporte, tasa, anios }) => {
      if (!(anios > 0)) return null;
      const i = tasa / 100 / 12, n = Math.round(anios * 12);
      const fv = i ? capital * (1 + i) ** n + aporte * (((1 + i) ** n - 1) / i) : capital + aporte * n;
      const ap = capital + aporte * n;
      return [['Valor final', fmt(fv)], ['Total aportado', fmt(ap)], ['Intereses ganados', fmt(fv - ap)]];
    },
    article: `<h2>¿Qué es el interés compuesto?</h2>
<p>El interés compuesto es el interés que se calcula sobre el capital inicial <em>y también</em> sobre los intereses acumulados de periodos anteriores. A diferencia del interés simple, tus ganancias generan nuevas ganancias, por eso el crecimiento se acelera con el tiempo.</p>
<h2>Fórmula utilizada</h2>
<p>Esta calculadora capitaliza mensualmente: <strong>VF = C × (1 + i)ⁿ + A × ((1 + i)ⁿ − 1) ÷ i</strong>, donde <em>C</em> es el capital inicial, <em>A</em> el aporte mensual, <em>i</em> la tasa anual dividida entre 12 y <em>n</em> el número de meses.</p>
<p>El factor más importante no es la tasa sino el tiempo: empezar cinco años antes suele pesar más que conseguir un par de puntos extra de rentabilidad.</p>`,
    faq: [
      ['¿Cada cuánto se capitalizan los intereses?', 'La calculadora asume capitalización mensual y aportes al final de cada mes, que es el caso más habitual en cuentas de ahorro y fondos.'],
      ['¿El resultado tiene en cuenta la inflación o los impuestos?', 'No. El valor final es nominal. Para estimar el valor real, resta la inflación esperada a la tasa de interés antes de calcular.'],
    ],
  },
  {
    slug: 'prestamo', icon: '🏦', name: 'Calculadora de préstamos y cuotas',
    desc: 'Calcula la cuota mensual de un préstamo, el total a pagar y los intereses. Sistema francés de cuota fija.',
    intro: 'Introduce el monto, la tasa de interés anual y el plazo para conocer tu cuota mensual fija y el costo total del crédito.',
    inputs: [
      { id: 'monto', label: 'Monto del préstamo', value: 10000 },
      { id: 'tasa', label: 'Tasa de interés anual (%)', value: 18 },
      { id: 'meses', label: 'Plazo (meses)', value: 36 },
    ],
    calc: ({ monto, tasa, meses }) => {
      if (!(meses > 0)) return null;
      const i = tasa / 100 / 12;
      const cuota = i ? (monto * i) / (1 - (1 + i) ** -meses) : monto / meses;
      return [['Cuota mensual', fmt(cuota)], ['Total a pagar', fmt(cuota * meses)], ['Total de intereses', fmt(cuota * meses - monto)]];
    },
    article: `<h2>¿Cómo se calcula la cuota de un préstamo?</h2>
<p>La mayoría de créditos personales, hipotecarios y de vehículo usan el <strong>sistema francés</strong>: una cuota fija durante todo el plazo. Al principio la mayor parte de la cuota son intereses y, con el tiempo, cada vez se amortiza más capital.</p>
<p>La fórmula es <strong>Cuota = M × i ÷ (1 − (1 + i)⁻ⁿ)</strong>, donde <em>M</em> es el monto, <em>i</em> la tasa mensual (tasa anual nominal ÷ 12) y <em>n</em> el número de cuotas.</p>
<h2>Consejos antes de pedir un crédito</h2>
<p>Compara siempre el costo total (no solo la cuota), pregunta por seguros y comisiones que no están incluidos en la tasa, y verifica si puedes hacer abonos anticipados sin penalización: reducen mucho los intereses.</p>`,
    faq: [
      ['¿La tasa es nominal o efectiva?', 'La calculadora usa la tasa nominal anual dividida entre 12. Si tu banco te da una tasa efectiva anual, la cuota real será ligeramente menor.'],
      ['¿Incluye seguros y comisiones?', 'No. Solo calcula capital e intereses. Pide a la entidad el costo total del crédito para comparar ofertas.'],
    ],
  },
  {
    slug: 'meta-de-ahorro', icon: '🎯', name: 'Calculadora de meta de ahorro',
    desc: 'Calcula cuánto debes ahorrar cada mes para alcanzar tu meta en el plazo que elijas, con o sin intereses.',
    intro: 'Define tu objetivo, el plazo y la rentabilidad esperada, y te decimos cuánto necesitas apartar cada mes.',
    inputs: [
      { id: 'meta', label: 'Meta de ahorro', value: 20000 },
      { id: 'inicial', label: 'Ahorro que ya tienes', value: 0 },
      { id: 'tasa', label: 'Rentabilidad anual (%)', value: 5 },
      { id: 'anios', label: 'Años', value: 5 },
    ],
    calc: ({ meta, inicial, tasa, anios }) => {
      if (!(anios > 0)) return null;
      const i = tasa / 100 / 12, n = Math.round(anios * 12);
      const g = (1 + i) ** n;
      const ap = i ? ((meta - inicial * g) * i) / (g - 1) : (meta - inicial) / n;
      if (ap <= 0) return [['Aporte mensual necesario', '0'], ['Nota', 'Ya alcanzas tu meta sin aportes']];
      return [['Aporte mensual necesario', fmt(ap)], ['Total que aportarás', fmt(ap * n)], ['Intereses que te ayudan', fmt(meta - inicial - ap * n)]];
    },
    article: `<h2>Cómo usar la calculadora de meta de ahorro</h2>
<p>Escribe la cantidad que quieres reunir (la cuota inicial de una casa, un fondo de emergencia, un viaje), lo que ya tienes ahorrado y en cuántos años quieres lograrlo. Si tu dinero estará en una cuenta remunerada o un fondo, añade la rentabilidad anual esperada; si lo guardas sin intereses, pon 0.</p>
<p>Un buen punto de partida es el fondo de emergencia: entre tres y seis meses de tus gastos fijos. Después, automatiza el aporte el mismo día que recibes tu ingreso para no depender de la fuerza de voluntad.</p>`,
    faq: [['¿Qué rentabilidad debo poner?', 'Usa una cifra conservadora. Para cuentas de ahorro, la tasa que publica tu banco; para inversiones a largo plazo, muchas personas usan entre 4% y 7% anual.']],
  },
  {
    slug: 'porcentajes', icon: '％', name: 'Calculadora de porcentajes',
    desc: 'Calcula el porcentaje de cualquier cantidad, y el resultado de sumar o restar ese porcentaje. Fácil y rápido.',
    intro: 'Calcula al instante cuánto es un porcentaje de una cantidad, y cuánto queda al sumarlo o restarlo.',
    inputs: [
      { id: 'pct', label: 'Porcentaje (%)', value: 15 },
      { id: 'cantidad', label: 'Cantidad', value: 200 },
    ],
    calc: ({ pct, cantidad }) => {
      const r = (cantidad * pct) / 100;
      return [[`${fmt(pct)}% de ${fmt(cantidad)}`, fmt(r)], [`${fmt(cantidad)} + ${fmt(pct)}%`, fmt(cantidad + r)], [`${fmt(cantidad)} − ${fmt(pct)}%`, fmt(cantidad - r)]];
    },
    article: `<h2>¿Cómo se calcula un porcentaje?</h2>
<p>Para hallar el X% de una cantidad, multiplica la cantidad por X y divide entre 100. Por ejemplo, el 15% de 200 es 200 × 15 ÷ 100 = <strong>30</strong>.</p>
<p>Un truco mental: el 10% se obtiene moviendo la coma un lugar a la izquierda (10% de 200 = 20). A partir de ahí, el 5% es la mitad (10) y el 15% es la suma de ambos (30).</p>`,
    faq: [['¿Cómo calculo qué porcentaje es un número de otro?', 'Divide la parte entre el total y multiplica por 100. Por ejemplo, 30 de 200 es 30 ÷ 200 × 100 = 15%.']],
  },
  {
    slug: 'descuento', icon: '🏷️', name: 'Calculadora de descuentos',
    desc: 'Calcula el precio final con descuento y cuánto ahorras. Ideal para rebajas, Black Friday y ofertas.',
    intro: 'Escribe el precio original y el porcentaje de descuento para saber el precio final y tu ahorro.',
    inputs: [
      { id: 'precio', label: 'Precio original', value: 80 },
      { id: 'desc', label: 'Descuento (%)', value: 25 },
    ],
    calc: ({ precio, desc }) => [['Precio final', fmt(precio * (1 - desc / 100))], ['Ahorras', fmt((precio * desc) / 100)]],
    article: `<h2>Cómo calcular un descuento</h2>
<p>Multiplica el precio por el porcentaje de descuento y divide entre 100: ese es tu ahorro. Réstalo del precio original para obtener el precio final. Por ejemplo, un artículo de 80 con 25% de descuento cuesta 80 − 20 = <strong>60</strong>.</p>
<p>Ojo con los descuentos acumulados: un 20% más un 10% adicional no es un 30%, sino un 28%, porque el segundo descuento se aplica sobre el precio ya rebajado.</p>`,
    faq: [['¿Cómo saber el precio original a partir del precio rebajado?', 'Divide el precio rebajado entre (1 − descuento ÷ 100). Si pagaste 60 con un 25% de descuento: 60 ÷ 0,75 = 80.']],
  },
  {
    slug: 'iva', icon: '🧾', name: 'Calculadora de IVA',
    desc: 'Agrega o quita el IVA de cualquier importe. Válida para España, México, Colombia, Argentina, Chile, Perú y más.',
    intro: 'Calcula el precio con IVA o desglosa el impuesto de un precio que ya lo incluye. Ajusta la tasa a la de tu país.',
    inputs: [
      { id: 'monto', label: 'Importe', value: 100 },
      { id: 'tasa', label: 'Tasa de IVA (%)', value: 19 },
      { id: 'modo', label: 'Operación', type: 'select', value: 'add', options: [['add', 'Agregar IVA (el importe no lo incluye)'], ['rem', 'Quitar IVA (el importe ya lo incluye)']] },
    ],
    calc: ({ monto, tasa, modo }) => {
      const base = modo === 'add' ? monto : monto / (1 + tasa / 100);
      const iva = (base * tasa) / 100;
      return [[modo === 'add' ? 'Total con IVA' : 'Base sin IVA', fmt(modo === 'add' ? base + iva : base)], ['IVA', fmt(iva)], [modo === 'add' ? 'Base sin IVA' : 'Total con IVA', fmt(modo === 'add' ? base : base + iva)]];
    },
    article: `<h2>Tasa general de IVA por país</h2>
<table><tr><th>País</th><th>Tasa general</th></tr>
<tr><td>España</td><td>21%</td></tr><tr><td>México</td><td>16%</td></tr><tr><td>Colombia</td><td>19%</td></tr><tr><td>Chile</td><td>19%</td></tr>
<tr><td>Argentina</td><td>21%</td></tr><tr><td>Perú (IGV)</td><td>18%</td></tr><tr><td>Ecuador</td><td>15%</td></tr><tr><td>Uruguay</td><td>22%</td></tr>
<tr><td>Bolivia</td><td>13%</td></tr><tr><td>Paraguay</td><td>10%</td></tr><tr><td>República Dominicana (ITBIS)</td><td>18%</td></tr><tr><td>Costa Rica</td><td>13%</td></tr>
<tr><td>Guatemala</td><td>12%</td></tr><tr><td>Panamá (ITBMS)</td><td>7%</td></tr></table>
<p class="muted">Tasas generales de referencia; existen tasas reducidas y exenciones. Verifica siempre la tasa vigente con la autoridad tributaria de tu país.</p>
<h2>Cómo quitar el IVA de un precio</h2>
<p>No basta con restar el porcentaje: hay que dividir el total entre (1 + tasa ÷ 100). Con un IVA del 19%, un precio final de 119 tiene una base de 119 ÷ 1,19 = <strong>100</strong> y un IVA de 19.</p>`,
    faq: [['¿Por qué restar el 19% a un precio con IVA da un resultado incorrecto?', 'Porque el IVA se calculó sobre la base, no sobre el total. Restar el 19% de 119 da 96,39, cuando la base real es 100.']],
  },
  {
    slug: 'imc', icon: '⚖️', name: 'Calculadora de IMC',
    desc: 'Calcula tu índice de masa corporal (IMC) y conoce tu rango de peso saludable según la OMS.',
    intro: 'Introduce tu peso y tu estatura para conocer tu índice de masa corporal y en qué categoría te encuentras.',
    inputs: [
      { id: 'peso', label: 'Peso (kg)', value: 70 },
      { id: 'altura', label: 'Estatura (cm)', value: 170 },
    ],
    calc: ({ peso, altura }) => {
      if (!(altura > 0) || !(peso > 0)) return null;
      const m = altura / 100, imc = peso / (m * m);
      const cat = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Peso normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
      return [['Tu IMC', fmt(imc, 1)], ['Categoría (OMS)', cat], ['Peso saludable para tu estatura', `${fmt(18.5 * m * m, 1)} – ${fmt(24.9 * m * m, 1)} kg`]];
    },
    article: `<h2>¿Qué es el IMC?</h2>
<p>El índice de masa corporal relaciona tu peso con tu estatura: <strong>IMC = peso (kg) ÷ estatura² (m)</strong>. La Organización Mundial de la Salud lo usa como indicador general para adultos.</p>
<table><tr><th>IMC</th><th>Categoría</th></tr><tr><td>Menos de 18,5</td><td>Bajo peso</td></tr><tr><td>18,5 – 24,9</td><td>Peso normal</td></tr><tr><td>25 – 29,9</td><td>Sobrepeso</td></tr><tr><td>30 o más</td><td>Obesidad</td></tr></table>
<p>El IMC no distingue entre grasa y músculo, ni aplica igual a niños, embarazadas o deportistas. Es una referencia, no un diagnóstico: consulta a un profesional de la salud.</p>`,
    faq: [['¿El IMC sirve para niños?', 'No directamente. En menores de 18 años se usan tablas de percentiles por edad y sexo.']],
  },
  {
    slug: 'regla-de-tres', icon: '✖️', name: 'Calculadora de regla de tres',
    desc: 'Resuelve reglas de tres simples directas al instante: si A es a B, entonces C es a X.',
    intro: 'Si A equivale a B, ¿a cuánto equivale C? Completa los tres valores y obtén X.',
    inputs: [
      { id: 'a', label: 'A', value: 5 },
      { id: 'b', label: 'B (equivale a A)', value: 20 },
      { id: 'c', label: 'C', value: 8 },
    ],
    calc: ({ a, b, c }) => (a ? [['X', fmt((b * c) / a, 4)], ['Operación', `${fmt(b, 4)} × ${fmt(c, 4)} ÷ ${fmt(a, 4)}`]] : null),
    article: `<h2>¿Cómo funciona la regla de tres?</h2>
<p>La regla de tres simple directa resuelve problemas de proporcionalidad: si 5 kilos cuestan 20, 8 kilos costarán X. Se multiplica en cruz y se divide: <strong>X = B × C ÷ A</strong> = 20 × 8 ÷ 5 = 32.</p>
<p>Sirve para recetas, escalas, precios por unidad, consumo de combustible y cualquier relación en la que, al aumentar una magnitud, la otra aumenta en la misma proporción.</p>`,
    faq: [['¿Y si la relación es inversa?', 'En una regla de tres inversa (por ejemplo, más trabajadores, menos días) la fórmula es X = A × B ÷ C.']],
  },
  {
    slug: 'propina', icon: '🍽️', name: 'Calculadora de propina',
    desc: 'Calcula la propina y divide la cuenta entre varias personas en segundos.',
    intro: 'Calcula cuánto dejar de propina y cuánto paga cada persona al dividir la cuenta.',
    inputs: [
      { id: 'cuenta', label: 'Total de la cuenta', value: 120 },
      { id: 'pct', label: 'Propina (%)', value: 10 },
      { id: 'personas', label: 'Personas', value: 4 },
    ],
    calc: ({ cuenta, pct, personas }) => {
      if (!(personas > 0)) return null;
      const p = (cuenta * pct) / 100;
      return [['Cada persona paga', fmt((cuenta + p) / personas)], ['Propina', fmt(p)], ['Total con propina', fmt(cuenta + p)]];
    },
    article: `<h2>¿Cuánto se deja de propina?</h2>
<p>Depende del país. En México y Colombia lo habitual es alrededor del 10%; en Estados Unidos entre el 15% y el 20%; en España y Argentina suele ser voluntaria y menor. Revisa si el servicio ya está incluido en la cuenta antes de sumarla.</p>`,
    faq: [],
  },
  {
    slug: 'dias-entre-fechas', icon: '📅', name: 'Calculadora de días entre fechas',
    desc: 'Cuenta cuántos días, semanas y meses hay entre dos fechas. Útil para plazos, vacaciones y eventos.',
    intro: 'Elige una fecha de inicio y una fecha final para saber exactamente cuántos días las separan.',
    inputs: [
      { id: 'desde', label: 'Desde', type: 'date', today: true },
      { id: 'hasta', label: 'Hasta', type: 'date' },
    ],
    calc: ({ desde, hasta }) => {
      if (!desde || !hasta) return null;
      const d = Math.round((Date.parse(hasta) - Date.parse(desde)) / 864e5);
      return [['Días', fmt(d)], ['Semanas', fmt(d / 7, 1)], ['Meses (aprox.)', fmt(d / 30.4375, 1)]];
    },
    article: `<h2>¿Cómo se cuentan los días entre dos fechas?</h2>
<p>La calculadora cuenta los días naturales (incluye fines de semana y festivos) desde la fecha inicial hasta la fecha final, sin incluir el día de inicio. Si la fecha final es anterior a la inicial, el resultado es negativo.</p>
<p>Es útil para calcular plazos de entrega, días que faltan para un viaje, duración de un contrato o semanas de embarazo.</p>`,
    faq: [['¿Tiene en cuenta los años bisiestos?', 'Sí. El cálculo se hace sobre el calendario real, así que el 29 de febrero se cuenta cuando corresponde.']],
  },
  {
    slug: 'edad', icon: '🎂', name: 'Calculadora de edad',
    desc: 'Calcula tu edad exacta en años, meses y días, y cuántos días faltan para tu próximo cumpleaños.',
    intro: 'Escribe tu fecha de nacimiento y descubre tu edad exacta y cuánto falta para tu cumpleaños.',
    inputs: [{ id: 'nacimiento', label: 'Fecha de nacimiento', type: 'date' }],
    calc: ({ nacimiento }) => {
      if (!nacimiento) return null;
      const [y, m, d] = nacimiento.split('-').map(Number);
      const now = new Date(), t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const b = new Date(y, m - 1, d);
      if (b > t) return null;
      let yy = t.getFullYear() - y, mm = t.getMonth() - (m - 1), dd = t.getDate() - d;
      if (dd < 0) { mm--; dd += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); }
      if (mm < 0) { yy--; mm += 12; }
      let next = new Date(t.getFullYear(), m - 1, d);
      if (next < t) next = new Date(t.getFullYear() + 1, m - 1, d);
      return [['Edad', `${yy} años, ${mm} meses y ${dd} días`], ['Días vividos', fmt(Math.round((t - b) / 864e5))], ['Días para tu cumpleaños', fmt(Math.round((next - t) / 864e5))]];
    },
    article: `<h2>¿Cómo se calcula la edad exacta?</h2>
<p>Se restan el año, el mes y el día de nacimiento de la fecha de hoy. Si aún no ha llegado tu día o tu mes de cumpleaños en el año actual, se ajusta "pidiendo prestado" un mes o un año, igual que en una resta con llevadas.</p>`,
    faq: [],
  },
  {
    slug: 'conversor-de-divisas', icon: '💱', name: 'Conversor de divisas',
    desc: 'Convierte entre dólares, euros, pesos mexicanos, colombianos, argentinos, chilenos, soles y más con tasas actualizadas a diario.',
    intro: 'Convierte entre las principales monedas del mundo hispano con tipos de cambio de referencia actualizados cada día.',
    inputs: [
      { id: 'monto', label: 'Cantidad', value: 100 },
      { id: 'de', label: 'De', type: 'select', value: 'USD', options: CURRENCIES },
      { id: 'a', label: 'A', type: 'select', value: 'MXN', options: CURRENCIES },
    ],
    calc: async ({ monto, de, a }) => {
      const c = window.__fx || (window.__fx = {});
      if (!c[de]) c[de] = fetch('https://open.er-api.com/v6/latest/' + de).then(r => r.json());
      const d = await c[de], t = d.rates[a];
      return [[`${fmt(monto)} ${de} =`, `${fmt(monto * t)} ${a}`], ['Tipo de cambio', `1 ${de} = ${fmt(t, 4)} ${a}`], ['Actualizado', new Date(d.time_last_update_unix * 1000).toLocaleDateString('es')]];
    },
    article: `<h2>Sobre los tipos de cambio</h2>
<p>Las tasas mostradas son de referencia de mercado y se actualizan una vez al día. El tipo de cambio que te aplique tu banco, casa de cambio o tarjeta incluirá un margen o comisión, por lo que recibirás algo menos al comprar o vender divisas.</p>
<p class="muted">Tasas proporcionadas por <a href="https://www.exchangerate-api.com" rel="nofollow noopener" target="_blank">Exchange Rate API</a>.</p>`,
    faq: [['¿Puedo usar estas tasas para operaciones reales?', 'Son informativas. Antes de una operación consulta la tasa exacta con tu entidad financiera.']],
  },
  {
    slug: 'prima-de-servicios-colombia', group: 'laboral', icon: '🎁', name: `Calculadora de prima de servicios ${YEAR} (Colombia)`,
    desc: `Calcula tu prima de servicios de junio o diciembre de ${YEAR} en Colombia según tu salario y los días trabajados en el semestre.`,
    intro: 'Escribe tu salario mensual y los días trabajados en el semestre para saber cuánto debes recibir de prima.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      AUX_INPUT,
      { id: 'dias', label: 'Días trabajados en el semestre', value: 180 },
    ],
    calc: ({ salario, aux, dias }) => {
      const base = salario + coAux(salario, aux);
      return [['Prima de servicios', cop((base * dias) / 360)], ['Base de liquidación', cop(base)], ['Días liquidados', fmt(dias)]];
    },
    article: `<h2>¿Cómo se calcula la prima de servicios?</h2>
<p>La prima equivale a un mes de salario por cada año trabajado, pagado en dos partes. La fórmula por semestre es <strong>(salario base × días trabajados en el semestre) ÷ 360</strong>. Un semestre completo son 180 días, así que quien trabajó los seis meses recibe medio salario.</p>
<p>La base incluye el auxilio de transporte cuando el trabajador tiene derecho a él, es decir, cuando gana hasta dos salarios mínimos. Si tu salario es variable (comisiones, horas extras), se usa el promedio del semestre.</p>
<h2>¿Cuándo se paga?</h2>
<p>La primera mitad se paga a más tardar el 30 de junio y la segunda dentro de los primeros 20 días de diciembre.</p>${CO_NOTE}`,
    faq: [
      ['¿Quién tiene derecho a la prima?', 'Todos los trabajadores con contrato laboral, incluidos los del servicio doméstico y los de tiempo parcial. No aplica a contratistas por prestación de servicios ni a quienes tienen salario integral.'],
      ['¿Qué pasa si no trabajé el semestre completo?', 'Se paga proporcional a los días trabajados. Con 90 días recibirías la mitad de la prima de un semestre completo.'],
    ],
  },
  {
    slug: 'cesantias-colombia', group: 'laboral', icon: '🏠', name: `Calculadora de cesantías e intereses ${YEAR} (Colombia)`,
    desc: `Calcula tus cesantías y los intereses sobre las cesantías de ${YEAR} en Colombia a partir de tu salario y días trabajados.`,
    intro: 'Calcula cuánto te corresponde de cesantías y de intereses según tu salario y los días trabajados en el año.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      AUX_INPUT,
      { id: 'dias', label: 'Días trabajados en el año', value: 360 },
    ],
    calc: ({ salario, aux, dias }) => {
      const ces = ((salario + coAux(salario, aux)) * dias) / 360;
      const int = (ces * dias * 0.12) / 360;
      return [['Cesantías', cop(ces)], ['Intereses sobre cesantías', cop(int)], ['Total', cop(ces + int)]];
    },
    article: `<h2>Fórmulas</h2>
<p><strong>Cesantías = (salario base × días trabajados) ÷ 360.</strong> Equivalen a un mes de salario por cada año trabajado. La base incluye el auxilio de transporte si tienes derecho a él.</p>
<p><strong>Intereses = (cesantías × días trabajados × 0,12) ÷ 360.</strong> Son el 12% anual sobre el saldo de cesantías, proporcional al tiempo trabajado.</p>
<h2>Fechas clave</h2>
<p>El empleador debe pagarte los intereses directamente a más tardar el 31 de enero, y consignar las cesantías en tu fondo antes del 15 de febrero del año siguiente.</p>${CO_NOTE}`,
    faq: [['¿Para qué puedo retirar las cesantías?', 'Mientras estés empleado, para compra, construcción o mejora de vivienda y para educación. Al terminar el contrato puedes retirarlas libremente.']],
  },
  {
    slug: 'liquidacion-colombia', group: 'laboral', icon: '📄', name: `Calculadora de liquidación laboral ${YEAR} (Colombia)`,
    desc: `Calcula tu liquidación de contrato en Colombia ${YEAR}: cesantías, intereses, prima de servicios y vacaciones pendientes.`,
    intro: 'Estima las prestaciones que deben pagarte al terminar tu contrato: cesantías, intereses, prima y vacaciones.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      AUX_INPUT,
      { id: 'diasAnio', label: 'Días trabajados en el año (cesantías)', value: 360 },
      { id: 'diasSem', label: 'Días trabajados en el semestre (prima)', value: 180 },
      { id: 'diasVac', label: 'Días trabajados sin disfrutar vacaciones', value: 360 },
    ],
    calc: ({ salario, aux, diasAnio, diasSem, diasVac }) => {
      const base = salario + coAux(salario, aux);
      const ces = (base * diasAnio) / 360, int = (ces * diasAnio * 0.12) / 360;
      const prima = (base * diasSem) / 360, vac = (salario * diasVac) / 720;
      return [['Total liquidación', cop(ces + int + prima + vac)], ['Cesantías', cop(ces)], ['Intereses sobre cesantías', cop(int)], ['Prima de servicios', cop(prima)], ['Vacaciones', cop(vac)]];
    },
    article: `<h2>¿Qué incluye la liquidación?</h2>
<p>Al terminar un contrato laboral, el empleador debe pagar las prestaciones causadas y no pagadas:</p>
<ul><li><strong>Cesantías:</strong> (salario base × días del año) ÷ 360.</li>
<li><strong>Intereses sobre cesantías:</strong> (cesantías × días × 0,12) ÷ 360.</li>
<li><strong>Prima de servicios:</strong> (salario base × días del semestre) ÷ 360.</li>
<li><strong>Vacaciones:</strong> (salario × días pendientes) ÷ 720. Aquí no se incluye el auxilio de transporte.</li></ul>
<p>Esta calculadora no incluye el salario de los últimos días trabajados, la indemnización por despido sin justa causa ni descuentos por préstamos; súmalos o réstalos según tu caso.</p>${CO_NOTE}`,
    faq: [
      ['¿Cuánto tiempo tiene el empleador para pagar la liquidación?', 'Debe pagarla al terminar el contrato. Si se retrasa sin justificación puede generarse una sanción moratoria a favor del trabajador.'],
      ['¿La liquidación incluye indemnización?', 'Solo si el despido fue sin justa causa. Su valor depende del tipo de contrato y del tiempo trabajado, y no está incluida en este cálculo.'],
    ],
  },
  {
    slug: 'salario-neto-colombia', group: 'laboral', icon: '💵', name: `Calculadora de salario neto ${YEAR} (Colombia)`,
    desc: `Calcula cuánto recibes realmente en Colombia en ${YEAR} después de los descuentos de salud, pensión y fondo de solidaridad.`,
    intro: 'Escribe tu salario mensual y conoce cuánto llega a tu cuenta después de los descuentos de ley.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: 3000000 },
      AUX_INPUT,
    ],
    calc: ({ salario, aux }) => {
      const n = salario / CO.smmlv;
      const tasa = n < 4 ? 0 : n < 16 ? 1 : n <= 17 ? 1.2 : n <= 18 ? 1.4 : n <= 19 ? 1.6 : n <= 20 ? 1.8 : 2;
      const salud = salario * 0.04, pension = salario * 0.04, fsp = (salario * tasa) / 100, ax = coAux(salario, aux);
      return [['Salario neto', cop(salario - salud - pension - fsp + ax)], ['Salud (4%)', '− ' + cop(salud)], ['Pensión (4%)', '− ' + cop(pension)], [`Fondo de solidaridad (${fmt(tasa, 1)}%)`, '− ' + cop(fsp)], ['Auxilio de transporte', '+ ' + cop(ax)]];
    },
    article: `<h2>Descuentos de ley sobre el salario</h2>
<p>A todo trabajador dependiente se le descuenta el <strong>4% para salud</strong> y el <strong>4% para pensión</strong>. El empleador aporta por su parte el 8,5% y el 12% respectivamente, que no salen de tu salario.</p>
<p>Quienes ganan cuatro salarios mínimos o más aportan además al <strong>Fondo de Solidaridad Pensional</strong>: 1% entre 4 y 16 salarios mínimos, y de 1,2% a 2% por encima de ese nivel.</p>
<p>El cálculo no incluye la retención en la fuente, que solo aplica a salarios altos y depende de tus deducciones personales, ni descuentos voluntarios como libranzas o aportes a cooperativas.</p>${CO_NOTE}`,
    faq: [['¿Cuánto es el salario mínimo neto?', `Con el mínimo de ${YEAR} ($ ${fmt(CO.smmlv)}) se descuentan $ ${fmt(CO.smmlv * 0.08, 0)} de salud y pensión y se suman $ ${fmt(CO.aux)} de auxilio de transporte: recibes $ ${fmt(CO.smmlv * 0.92 + CO.aux, 0)}.`]],
  },
  {
    slug: 'horas-extras-colombia', group: 'laboral', icon: '⏱️', name: `Calculadora de horas extras y recargos ${YEAR} (Colombia)`,
    desc: `Calcula el valor de tus horas extras diurnas y nocturnas y de los recargos nocturnos, dominicales y festivos en Colombia ${YEAR}.`,
    intro: 'Indica tu salario y las horas trabajadas de cada tipo para saber cuánto deben pagarte adicional este mes.',
    inputs: [
      { id: 'salario', label: 'Salario mensual', value: CO.smmlv },
      { id: 'divisor', label: 'Horas mensuales de la jornada', value: 210 },
      { id: 'hed', label: 'Horas extras diurnas', value: 4 },
      { id: 'hen', label: 'Horas extras nocturnas', value: 0 },
      { id: 'rn', label: 'Horas ordinarias nocturnas', value: 0 },
      { id: 'df', label: 'Horas ordinarias en domingo o festivo', value: 0 },
    ],
    calc: ({ salario, divisor, hed, hen, rn, df }) => {
      if (!(divisor > 0)) return null;
      const h = salario / divisor;
      const a = hed * h * 1.25, b = hen * h * 1.75, c = rn * h * 0.35, d = df * h * 0.9;
      return [['Total adicional a pagar', cop(a + b + c + d)], ['Valor de la hora ordinaria', cop(h)], ['Extras diurnas (+25%)', cop(a)], ['Extras nocturnas (+75%)', cop(b)], ['Recargo nocturno (35%)', cop(c)], ['Recargo dominical/festivo (90%)', cop(d)]];
    },
    article: `<h2>Porcentajes vigentes</h2>
<table><tr><th>Concepto</th><th>Recargo sobre la hora ordinaria</th></tr>
<tr><td>Hora extra diurna</td><td>25%</td></tr><tr><td>Hora extra nocturna</td><td>75%</td></tr>
<tr><td>Recargo nocturno (7:00 p. m. a 6:00 a. m.)</td><td>35%</td></tr>
<tr><td>Recargo dominical o festivo</td><td>90% (desde el 1 de julio de 2026; 100% desde julio de 2027)</td></tr></table>
<h2>Valor de la hora ordinaria</h2>
<p>Se obtiene dividiendo el salario mensual entre las horas mensuales de la jornada. Con la jornada máxima de 42 horas semanales, vigente desde el 15 de julio de 2026, el divisor habitual es <strong>210</strong> (antes era 220). Si tu jornada pactada es distinta, cambia ese valor.</p>
<p>Las horas extras se pagan completas con su recargo (hora × 1,25 o × 1,75). En las horas ordinarias nocturnas o dominicales solo se suma el recargo, porque la hora ya está incluida en tu salario. Si el domingo no hace parte de tu jornada habitual, además del recargo deben pagarte la hora o darte un descanso compensatorio.</p>${CO_NOTE}`,
    faq: [['¿Cuántas horas extras se pueden trabajar?', 'Como regla general, máximo 2 horas diarias y 12 a la semana.']],
  },
  {
    slug: 'aguinaldo-mexico', group: 'laboral', icon: '🎄', name: `Calculadora de aguinaldo ${YEAR} (México)`,
    desc: `Calcula tu aguinaldo ${YEAR} en México, completo o proporcional a los días trabajados en el año.`,
    intro: 'Escribe tu salario mensual y los días trabajados en el año para saber cuánto te corresponde de aguinaldo.',
    inputs: [
      { id: 'salario', label: 'Salario mensual bruto', value: 12000 },
      { id: 'diasAg', label: 'Días de aguinaldo', value: 15 },
      { id: 'dias', label: 'Días trabajados en el año', value: 365 },
    ],
    calc: ({ salario, diasAg, dias }) => {
      const diario = salario / 30;
      return [['Aguinaldo', '$ ' + fmt((diario * diasAg * dias) / 365)], ['Salario diario', '$ ' + fmt(diario)], ['Días de aguinaldo proporcionales', fmt((diasAg * dias) / 365, 1)]];
    },
    article: `<h2>¿Cómo se calcula el aguinaldo?</h2>
<p>La Ley Federal del Trabajo establece un aguinaldo mínimo de <strong>15 días de salario</strong>, que debe pagarse antes del 20 de diciembre. Muchas empresas y el sector público otorgan más días; revisa tu contrato y cambia el valor si es tu caso.</p>
<p>Fórmula: <strong>salario diario × días de aguinaldo × días trabajados ÷ 365</strong>. Si no trabajaste el año completo, o ya no trabajas en la empresa, tienes derecho a la parte proporcional.</p>
<p>El resultado es bruto: una parte del aguinaldo está exenta de ISR y sobre el excedente tu empleador retiene el impuesto.</p>
<p class="muted">Cálculo orientativo; no reemplaza la liquidación oficial de tu empleador.</p>`,
    faq: [['¿Qué pasa si no me pagan el aguinaldo?', 'Puedes acudir a la PROFEDET para recibir asesoría gratuita y reclamarlo; tienes un año para hacerlo.']],
  },
];

// --------------------------------------------------- conversiones de unidades
const U = {
  kg: ['kilogramo', 'kilogramos', 'kilos', 'kg'], lb: ['libra', 'libras', 'libras', 'lb'],
  cm: ['centímetro', 'centímetros', 'centimetros', 'cm'], in: ['pulgada', 'pulgadas', 'pulgadas', 'in'],
  m: ['metro', 'metros', 'metros', 'm'], ft: ['pie', 'pies', 'pies', 'ft'],
  km: ['kilómetro', 'kilómetros', 'kilometros', 'km'], mi: ['milla', 'millas', 'millas', 'mi'],
  l: ['litro', 'litros', 'litros', 'L'], gal: ['galón (EE. UU.)', 'galones (EE. UU.)', 'galones', 'gal'],
  g: ['gramo', 'gramos', 'gramos', 'g'], oz: ['onza', 'onzas', 'onzas', 'oz'],
  c: ['grado Celsius', 'grados Celsius', 'celsius', '°C'], f: ['grado Fahrenheit', 'grados Fahrenheit', 'fahrenheit', '°F'],
};
const COMMON = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 250, 300, 400, 500, 1000];
const kStr = k => String(k).replace('.', ',');
const linear = (a, b, k, valsA, valsB) => [
  { from: a, to: b, k, pre: 0, post: 0, op: `× ${kStr(k)}`, formula: `${U[b][1]} = ${U[a][1]} × ${kStr(k)}`, vals: valsA || COMMON },
  { from: b, to: a, k: 1 / k, pre: 0, post: 0, op: `÷ ${kStr(k)}`, formula: `${U[a][1]} = ${U[b][1]} ÷ ${kStr(k)}`, vals: valsB || COMMON },
];
const pairs = [
  ...linear('lb', 'kg', 0.45359237),
  ...linear('in', 'cm', 2.54, [...COMMON, 24, 27, 32, 43, 65].sort((x, y) => x - y)),
  ...linear('ft', 'm', 0.3048),
  ...linear('mi', 'km', 1.609344),
  ...linear('gal', 'l', 3.785411784),
  ...linear('oz', 'g', 28.349523125),
  { from: 'c', to: 'f', k: 1.8, pre: 0, post: 32, formula: '°F = °C × 1,8 + 32', vals: [-40, -20, -10, 0, 5, 10, 15, 20, 25, 30, 35, 36, 37, 38, 39, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 220, 250] },
  { from: 'f', to: 'c', k: 1 / 1.8, pre: -32, post: 0, formula: '°C = (°F − 32) ÷ 1,8', vals: [0, 10, 20, 32, 40, 50, 60, 70, 75, 80, 90, 95, 98, 100, 101, 102, 103, 104, 105, 110, 120, 150, 200, 212, 250, 300, 350, 400, 425, 450] },
].map(p => ({ ...p, slug: `${U[p.from][2]}-a-${U[p.to][2]}`, conv: x => (x + p.pre) * p.k + p.post }));

const unit = (key, v) => U[key][Math.abs(v) === 1 ? 0 : 1];
const vSlug = v => (v < 0 ? `menos-${-v}` : `${v}`);
const convUrl = (p, v) => `/convertir/${vSlug(v)}-${p.slug}/`;
const hubUrl = p => `/convertir/${p.slug}/`;
const convInputs = p => [{ id: 'valor', label: `Valor en ${U[p.from][1]}`, value: 1 }, { id: 'par', type: 'hidden', value: p.slug }];
const reverse = p => pairs.find(q => q.from === p.to && q.to === p.from);

// ---------------------------------------------------------------- porcentajes
const PCTS = [5, 10, 12, 15, 16, 18, 19, 20, 21, 25, 30, 35, 40, 50, 60, 70, 75, 80, 90];
const BASES = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 5000, 10000, 20000, 50000];
const pctUrl = (p, b) => `/porcentaje/${p}-por-ciento-de-${b}/`;

// ===================================================================== build
fs.rmSync(OUT, { recursive: true, force: true });
const toolUrl = t => `/${t.slug}/`;
const toolCards = list => `<div class="grid">${list.map(t => `<a class="card" href="${href(toolUrl(t))}"><span class="ico">${t.icon}</span><strong>${esc(t.name)}</strong></a>`).join('')}</div>`;

// Calculadoras
for (const t of tools) {
  page({
    url: toolUrl(t), title: `${t.name} online gratis | ${cfg.siteName}`, desc: t.desc,
    crumbs: [[t.name, toolUrl(t)]],
    ld: [
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, url: abs(toolUrl(t)), description: t.desc, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'es', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      ...(t.faq.length ? [faqLd(t.faq)] : []),
    ],
    body: `<h1>${esc(t.name)}</h1><p class="lead">${esc(t.intro)}</p>
${form(t.slug, t.inputs)}
${affiliate(t.slug)}
<article>${t.article}${faqHtml(t.faq)}</article>
${slotAd()}
<h2>Otras calculadoras</h2>${toolCards([...tools.filter(o => o !== t && o.group === t.group), ...tools.filter(o => o.group !== t.group)].slice(0, 6))}`,
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
  body: `<h1>${esc(cfg.tagline)}</h1>
<p class="lead">Herramientas simples para tus cuentas del día a día: finanzas, porcentajes, salud, fechas y conversiones.</p>
<h2 id="calculadoras">Calculadoras</h2>${toolCards(tools.filter(t => !t.group))}
<h2 id="laborales">Calculadoras laborales ${YEAR}</h2>${toolCards(tools.filter(t => t.group === 'laboral'))}
${slotAd()}
<h2>Conversores de unidades</h2>
<p class="links">${pairs.map(p => `<a href="${href(hubUrl(p))}">${U[p.from][1]} a ${U[p.to][1]}</a>`).join('')}</p>
<h2>Porcentajes más buscados</h2>
<p class="links">${[[10, 100], [15, 200], [20, 500], [25, 1000], [30, 1500], [50, 2000], [19, 1000], [21, 100], [16, 5000], [5, 10000]].map(([p, b]) => `<a href="${href(pctUrl(p, b))}">${p}% de ${fmt(b)}</a>`).join('')}<a href="${href('/porcentaje/')}">Ver todos →</a></p>`,
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

write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${abs(u)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
if (cfg.adsense?.client) write('ads.txt', `google.com, ${cfg.adsense.client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);
// Archivos que deben quedar en la raíz del sitio (verificaciones de buscadores, etc.)
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
write('.nojekyll', '');

console.log(`✔ ${urls.length} páginas generadas en dist/ para ${SITE}`);
if (/TU-USUARIO/.test(SITE)) console.warn('⚠ Falta configurar "siteUrl" en site.config.json');
if (/ejemplo\.com/.test(cfg.contactEmail)) console.warn('⚠ Falta configurar "contactEmail" en site.config.json');
