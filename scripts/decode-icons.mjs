// Decodes base64 icon sources (icons-src/*.b64) into public/icons at build time.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
for (const f of readdirSync('icons-src').filter(f => f.endsWith('.b64'))) {
  writeFileSync('public/icons/' + f.slice(0, -4), Buffer.from(readFileSync('icons-src/' + f, 'utf8').trim(), 'base64'));
  console.log('icon:', f.slice(0, -4));
}
