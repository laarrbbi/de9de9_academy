// After `npm run build`: every internal link and asset in dist/ must exist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

function resolves(url) {
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  const target = join(DIST, path);
  return path.endsWith('/') ? existsSync(join(target, 'index.html')) : existsSync(target);
}

const broken = [];
const files = htmlFiles(DIST);
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!url.startsWith('//') && !resolves(url)) broken.push(`${file.slice(DIST.length)} -> ${url}`);
  }
}

if (broken.length > 0) {
  console.error(`Broken internal links (${broken.length}):\n${broken.join('\n')}`);
  process.exit(1);
}
console.log(`Checked ${files.length} pages: all internal links resolve.`);
