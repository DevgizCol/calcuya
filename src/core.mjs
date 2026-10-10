// Configuración y utilidades compartidas por el generador.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
export const SITE = (process.env.SITE_URL || cfg.siteUrl).replace(/\/$/, '');
export const B = new URL(SITE).pathname.replace(/\/$/, '');
export const OUT = path.join(ROOT, 'dist');
export const TODAY = new Date().toISOString().slice(0, 10);
export const YEAR = TODAY.slice(0, 4);
export const MONTH = new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' });

export const fmt = (n, d = 2) => Number(n).toLocaleString('es', { maximumFractionDigits: d, useGrouping: 'always' });
export const num = n => { const a = Math.abs(n); return fmt(n, a >= 100 ? 2 : a >= 1 ? 3 : 5); };
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const href = p => B + p;
export const abs = p => SITE + p;