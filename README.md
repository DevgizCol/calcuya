# CalcuYa

Sitio estático de calculadoras y conversores en español, pensado para captar tráfico de buscadores y monetizarlo con anuncios y afiliados. Sin servidor, sin base de datos y sin dependencias: costo de operación $0.

## Qué incluye

- 12 calculadoras interactivas (interés compuesto, préstamos, meta de ahorro, porcentajes, descuentos, IVA, IMC, regla de tres, propina, días entre fechas, edad, divisas).
- ~600 páginas de conversiones (`/convertir/150-libras-a-kilos/`) y ~380 de porcentajes (`/porcentaje/15-por-ciento-de-200/`), cada una con respuesta, fórmula, tabla y calculadora.
- SEO técnico: canonical, Open Graph, datos estructurados, `sitemap.xml`, `robots.txt`, modo claro/oscuro, responsive.
- Páginas legales (privacidad, términos, contacto, acerca de) que exigen las redes de anuncios.

## Comandos

```bash
npm run dev     # genera dist/ y lo sirve en http://localhost:4173
npm run build   # solo genera dist/
```

Para previsualizar en local con rutas correctas: `SITE_URL=http://localhost:4173 npm run dev`.

## Configuración (`site.config.json`)

| Campo | Para qué |
|---|---|
| `siteUrl` | URL pública final, sin barra al final. Ej.: `https://usuario.github.io/calcuya` |
| `contactEmail` | Correo que aparece en Contacto y Privacidad |
| `googleSiteVerification` | Código de verificación de Google Search Console |
| `adsense.client` | Tu ID `ca-pub-XXXXXXXX` (activa Auto Ads y genera `ads.txt`) |
| `ads.headHtml` / `ads.slotHtml` | Código de otra red de anuncios (cabecera / bloque dentro de la página) |
| `analyticsHtml` | Snippet de analítica (p. ej. Cloudflare Web Analytics, gratis) |
| `affiliates` | Cajas "Recomendado" por calculadora; pon `enabled: true` y tu enlace |

## Publicar gratis en GitHub Pages

1. Crea una cuenta en github.com y un repositorio **público** llamado `calcuya`.
2. Edita `siteUrl` y `contactEmail` en `site.config.json`.
3. Sube el código:
   ```bash
   git remote add origin https://github.com/DevgizCol/calcuya.git
   git push -u origin main
   ```
4. En el repositorio: **Settings → Pages → Source: GitHub Actions**. El workflow incluido publica el sitio en cada `push`.

## Después de publicar

1. **Google Search Console** (search.google.com/search-console): añade la URL, pega el código en `googleSiteVerification`, publica y envía `sitemap.xml`. Haz lo mismo en Bing Webmaster Tools.
2. **Monetización**: ver la sección siguiente.
3. **Crecer**: añade calculadoras en el array `tools` de `build.mjs` y pares de unidades en `pairs`; cada entrada genera sus páginas y entra sola al sitemap.

## Monetización sin inversión

- **Con subdominio gratuito** (`github.io`): AdSense normalmente no lo acepta. Usa redes que sí admiten subdominios (Adsterra, Monetag) pegando su código en `ads.headHtml` / `ads.slotHtml`, y enlaces de afiliados (Amazon Afiliados, Hotmart) en `affiliates`.
- **Con dominio propio** (~10 USD/año, único gasto opcional): puedes solicitar Google AdSense, que suele pagar mejor. Pega tu `ca-pub-...` en `adsense.client`.

## Añadir una calculadora

En `build.mjs`, agrega un objeto a `tools` con `slug`, `name`, `desc`, `intro`, `inputs`, `calc`, `article` y `faq`. La función `calc` corre en el navegador: recibe los valores del formulario y devuelve filas `[etiqueta, valor]`; solo puede usar `fmt`.
