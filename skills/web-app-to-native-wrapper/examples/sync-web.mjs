// node scripts/sync-web.mjs [path/to/dist] → Web/ (offline, no analytics)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.resolve(root, process.argv[2] || '../my-web-app/dist');
const web = path.join(root, 'Web');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error(`no web build at ${dist}`);
if (!fs.existsSync(path.join(root, 'vendor'))) throw new Error('vendor/ missing: download three.js and fonts into it first');

fs.rmSync(web, { recursive: true, force: true });
fs.cpSync(dist, web, { recursive: true, filter: (f) => !f.endsWith('.DS_Store') });
fs.cpSync(path.join(root, 'vendor'), path.join(web, 'vendor'), { recursive: true });

const file = path.join(web, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const swap = (re, to) => {
  if (!re.test(html)) throw new Error(`index.html: ${re} not found — update sync-web.mjs`);
  html = html.replace(re, to);
};

swap(/<script async src="https:\/\/www\.googletagmanager\.com[^]*?<\/script>\s*<script>[^]*?gtag\('config'[^]*?<\/script>\s*/, '');
swap(/<link[^>]+fonts\.googleapis\.com[^>]*>\s*(<link[^>]+fonts\.gstatic\.com[^>]*>\s*)?<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/, '<link href="vendor/fonts/fonts.css" rel="stylesheet">');
swap(/"three": "https:\/\/[^"]+\/three\.module\.js"/, '"three": "./vendor/three/build/three.module.js"');
swap(/"three\/addons\/": "https:\/\/[^"]+\/examples\/jsm\/"/, '"three/addons/": "./vendor/three/addons/"');
fs.writeFileSync(file, html);

const allowed = /apps\.apple\.com|example\.com/;
const left = [...html.matchAll(/https?:\/\/[^\s"')]+/g)].map((m) => m[0]).filter((u) => !allowed.test(u));
const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`Web/ · ${(size(web) / 1e6).toFixed(1)} MB${left.length ? ' · still external: ' + left.join(' ') : ' · fully offline'}`);
