// node tools/build_dist.mjs → dist/ (upload over the old one; links carry ?v=<hash>)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const COPY = ['assets'];
const BIG = ['assets/room.glb'];

fs.rmSync(DIST, { recursive: true, force: true });
const copy = (rel) => fs.cpSync(path.join(ROOT, rel), path.join(DIST, rel), { recursive: true, filter: (p) => path.basename(p) !== '.DS_Store' });
for (const rel of COPY) copy(rel);

const hash = (bufs) => crypto.createHash('sha1').update(Buffer.concat(bufs)).digest('hex').slice(0, 8);
const srcFiles = fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js')).sort();
const v = hash(srcFiles.map((f) => fs.readFileSync(path.join(ROOT, 'src', f))));
copy('src');

for (const f of srcFiles) {
  const p = path.join(DIST, 'src', f);
  let js = fs.readFileSync(p, 'utf8').replace(/(from\s+['"]\.\/[\w-]+\.js)(['"])/g, `$1?v=${v}$2`);
  for (const rel of BIG) {
    const h = hash([fs.readFileSync(path.join(ROOT, rel))]);
    js = js.replaceAll(`'${rel}'`, `'${rel}?v=${h}'`);
  }
  fs.writeFileSync(p, js);
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('src="src/main.js"', `src="src/main.js?v=${v}"`);
if (!html.includes(`main.js?v=${v}`)) throw new Error('index.html: <script src="src/main.js"> not found');
fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log(`dist/ · code v=${v}`);
