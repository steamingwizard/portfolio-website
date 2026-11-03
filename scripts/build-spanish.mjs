import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', ...['dreams-onyx', 'pool-planet', 'catalonia', 'dreams-flora', 'azurea-residences'].map(slug => `projects/${slug}.html`)];
const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'locales/es.json'), 'utf8'));
const unchanged = new Set(['Guillermo Estrada', 'Dreams Onyx', 'Dreams Flora', 'Pool Planet', 'Catalonia', 'Blue Caribbean', 'Secrets Tides', 'Royal Beach', 'RE/MAX', 'FlowDesk', 'Azurea Residences', 'Azurea', 'Residences', 'Cormorant', 'Garamond', 'MONTSERRAT', 'Web', 'UI', 'HTML/CSS', 'Marketing', 'A.', '© 2026 Guillermo Estrada', '© 2026 Guillermo Estrada ·']);
const missing = new Set();
const normalize = value => value.trim().replace(/\s+/g, ' ');
function translate(value) {
  const text = normalize(value);
  if (!text) return value;
  let translated = dictionary[text];
  if (!translated && text.startsWith('Open full image: ')) translated = `Abrir imagen completa: ${translate(text.slice(17))}`;
  if (!translated && text.endsWith(' | Guillermo Estrada')) {
    const [brand, title] = text.slice(0, -20).split(' — ');
    if (title && dictionary[title]) translated = `${brand} — ${dictionary[title]} | Guillermo Estrada`;
  }
  if (!translated) {
    if (/[A-Za-z]/.test(text) && !unchanged.has(text) && !/^#[0-9a-f]+$/i.test(text)) missing.add(text);
    return value;
  }
  return value.replace(/\S[\s\S]*\S|\S/, () => translated);
}
const relative = (from, to) => path.relative(path.dirname(path.join(root, from)), path.join(root, to)).replaceAll('\\', '/');
function switcher(page, spanish) {
  const from = spanish ? `es/${page}` : page;
  const en = relative(from, page);
  const es = relative(from, `es/${page}`);
  return `<nav class="language-switch" aria-label="${spanish ? 'Idioma' : 'Language'}">${spanish ? `<a href="${en}" lang="en" hreflang="en" aria-label="View this page in English">EN</a>` : '<span lang="en" aria-current="page">EN</span>'}<span class="language-divider" aria-hidden="true">/</span>${spanish ? '<span lang="es" aria-current="page">ES</span>' : `<a href="${es}" lang="es" hreflang="es" aria-label="Ver esta página en español">ES</a>`}</nav>`;
}
function decorate(html, page, spanish) {
  const from = spanish ? `es/${page}` : page;
  const links = ['en', 'es'].map(lang => `  <link rel="alternate" hreflang="${lang}" href="${relative(from, lang === 'es' ? `es/${page}` : page)}">`).join('\n');
  html = html.replace('</head>', `  <link rel="stylesheet" href="${relative(from, 'languages.css')}">\n${links}\n</head>`);
  const control = switcher(page, spanish);
  if (page === 'index.html') {
    html = html.replace(/(<nav class="nav-links"[\s\S]*?<\/nav>)/, `$1\n      ${control}`);
  } else if (page.endsWith('azurea-residences.html')) {
    html = html.replace(/(<a class="back-link"[^>]*>[\s\S]*?<\/a>)/, `<div class="nav-actions">$1${control}</div>`);
  } else {
    html = html.replace(/(<a href="[^\"]+#work">[\s\S]*?<\/a>)/, `<div class="nav-actions">$1${control}</div>`);
  }
  return html;
}
function clean(html) {
  return html.replace(/\s*<nav class="language-switch"[\s\S]*?<\/nav>/g, '')
    .replace(/<div class="nav-actions">([\s\S]*?)<\/div>/g, '$1')
    .replace(/\s*<link rel="alternate" hreflang="(?:en|es)"[^>]*>/g, '')
    .replace(/\s*<link rel="stylesheet" href="[^\"]*languages\.css">/g, '');
}
function localizePaths(html, page) {
  const from = `es/${page}`;
  function resolve(target) {
    if (/^(?:https?:|mailto:|data:|#)/.test(target)) return target;
    const [, location, suffix = ''] = target.match(/^([^?#]+)([?#].*)?$/);
    const original = path.relative(root, path.resolve(root, path.dirname(page), decodeURIComponent(location))).replaceAll('\\', '/');
    return relative(from, pages.includes(original) ? `es/${original}` : original) + suffix;
  }
  html = html.replace(/\b(href|src)="([^"]+)"/g, (_, attribute, target) => `${attribute}="${resolve(target)}"`);
  html = html.replace(/url\("([^\"]+)"\)/g, (_, target) => `url("${resolve(target)}")`);
  return html.replace(/subject=Resume%20request/g, 'subject=Solicitud%20de%20CV');
}

const outputs = [];
for (const page of pages) {
  const english = clean(fs.readFileSync(path.join(root, page), 'utf8'));
  // Protect CSS/JS from prose translation, then translate text nodes and reader-facing attributes.
  const blocks = [];
  let spanish = english.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/g, block => { blocks.push(block); return `<!--BLOCK_${blocks.length - 1}-->`; });
  spanish = spanish.replace(/>([^<>]+)</g, (_, text) => `>${translate(text)}<`)
    .replace(/\b(alt|aria-label)="([^"]+)"/g, (_, name, value) => `${name}="${translate(value)}"`)
    .replace(/(name="description"\s+content=")([^"]+)(")/g, (_, before, value, after) => before + translate(value) + after)
    .replace(/<!--BLOCK_(\d+)-->/g, (_, index) => blocks[Number(index)])
    .replace('<html lang="en">', '<html lang="es">');
  spanish = decorate(localizePaths(spanish, page), page, true);
  outputs.push([page, decorate(english, page, false)], [`es/${page}`, spanish]);
}
if (missing.size) {
  console.error('Add Spanish translations before building:\n' + [...missing].join('\n'));
  process.exit(1);
}
for (const [file, html] of outputs) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), html);
}
console.log(`Built ${pages.length} Spanish pages and added matching language links to ${pages.length} English pages.`);
