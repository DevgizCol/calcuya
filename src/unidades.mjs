// Datos de las páginas generadas en serie: conversiones de unidades y porcentajes.

// --------------------------------------------------- conversiones de unidades
export const U = {
  kg: ['kilogramo', 'kilogramos', 'kilos', 'kg'], lb: ['libra', 'libras', 'libras', 'lb'],
  cm: ['centímetro', 'centímetros', 'centimetros', 'cm'], in: ['pulgada', 'pulgadas', 'pulgadas', 'in'],
  m: ['metro', 'metros', 'metros', 'm'], ft: ['pie', 'pies', 'pies', 'ft'],
  km: ['kilómetro', 'kilómetros', 'kilometros', 'km'], mi: ['milla', 'millas', 'millas', 'mi'],
  l: ['litro', 'litros', 'litros', 'L'], gal: ['galón (EE. UU.)', 'galones (EE. UU.)', 'galones', 'gal'],
  g: ['gramo', 'gramos', 'gramos', 'g'], oz: ['onza', 'onzas', 'onzas', 'oz'],
  c: ['grado Celsius', 'grados Celsius', 'celsius', '°C'], f: ['grado Fahrenheit', 'grados Fahrenheit', 'fahrenheit', '°F'],
};
export const COMMON = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 250, 300, 400, 500, 1000];
export const kStr = k => String(k).replace('.', ',');
export const linear = (a, b, k, valsA, valsB) => [
  { from: a, to: b, k, pre: 0, post: 0, op: `× ${kStr(k)}`, formula: `${U[b][1]} = ${U[a][1]} × ${kStr(k)}`, vals: valsA || COMMON },
  { from: b, to: a, k: 1 / k, pre: 0, post: 0, op: `÷ ${kStr(k)}`, formula: `${U[a][1]} = ${U[b][1]} ÷ ${kStr(k)}`, vals: valsB || COMMON },
];
export const pairs = [
  ...linear('lb', 'kg', 0.45359237),
  ...linear('in', 'cm', 2.54, [...COMMON, 24, 27, 32, 43, 65].sort((x, y) => x - y)),
  ...linear('ft', 'm', 0.3048),
  ...linear('mi', 'km', 1.609344),
  ...linear('gal', 'l', 3.785411784),
  ...linear('oz', 'g', 28.349523125),
  { from: 'c', to: 'f', k: 1.8, pre: 0, post: 32, formula: '°F = °C × 1,8 + 32', vals: [-40, -20, -10, 0, 5, 10, 15, 20, 25, 30, 35, 36, 37, 38, 39, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 220, 250] },
  { from: 'f', to: 'c', k: 1 / 1.8, pre: -32, post: 0, formula: '°C = (°F − 32) ÷ 1,8', vals: [0, 10, 20, 32, 40, 50, 60, 70, 75, 80, 90, 95, 98, 100, 101, 102, 103, 104, 105, 110, 120, 150, 200, 212, 250, 300, 350, 400, 425, 450] },
].map(p => ({ ...p, slug: `${U[p.from][2]}-a-${U[p.to][2]}`, conv: x => (x + p.pre) * p.k + p.post }));

export const unit = (key, v) => U[key][Math.abs(v) === 1 ? 0 : 1];
export const vSlug = v => (v < 0 ? `menos-${-v}` : `${v}`);
export const convUrl = (p, v) => `/convertir/${vSlug(v)}-${p.slug}/`;
export const hubUrl = p => `/convertir/${p.slug}/`;
export const convInputs = p => [{ id: 'valor', label: `Valor en ${U[p.from][1]}`, value: 1 }, { id: 'par', type: 'hidden', value: p.slug }];
export const reverse = p => pairs.find(q => q.from === p.to && q.to === p.from);

// ---------------------------------------------------------------- porcentajes
export const PCTS = [5, 10, 12, 15, 16, 18, 19, 20, 21, 25, 30, 35, 40, 50, 60, 70, 75, 80, 90];
export const BASES = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 5000, 10000, 20000, 50000];
export const pctUrl = (p, b) => `/porcentaje/${p}-por-ciento-de-${b}/`;
