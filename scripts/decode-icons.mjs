// Wipes public/icons and rebuilds it from icons-src/*.b64 at build time (only the current icon set ships).
import { readdirSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
rmSync('public/icons', { recursive: true, force: true });
mkdirSync('public/icons', { recursive: true });
for (const f of readdirSync('icons-src').filter(f => f.endsWith('.b64'))) {
  writeFileSync('public/icons/' + f.slice(0, -4), Buffer.from(readFileSync('icons-src/' + f, 'utf8').trim(), 'base64'));
  console.log('icon:', f.slice(0, -4));
}
