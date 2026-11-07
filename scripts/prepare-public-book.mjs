import { readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, createDecipheriv } from 'node:crypto';

const html = readFileSync('public/index.html', 'utf8');
const match = html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Encrypted book data was not found');

const encrypted = JSON.parse(match[1]);
const codes = String(process.env.BOOK_CODES || process.env.BOOK_CODE || '')
  .split(',').map(code => code.trim().toUpperCase()).filter(Boolean);
if (!codes.length) throw new Error('BOOK_CODE or BOOK_CODES is required to publish the open book');

let raw;
for (const code of codes) {
  try {
    const key = pbkdf2Sync(code, Buffer.from(encrypted.s, 'base64'), encrypted.n, 32, 'sha256');
    const packed = Buffer.from(encrypted.c, 'base64');
    const tag = packed.subarray(packed.length - 16);
    const body = packed.subarray(0, packed.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.i, 'base64'));
    decipher.setAuthTag(tag);
    raw = Buffer.concat([decipher.update(body), decipher.final()]);
    JSON.parse(raw.toString('utf8'));
    break;
  } catch {}
}
if (!raw) throw new Error('None of the configured book codes could decrypt the book');

writeFileSync('public/book-data.json', raw);
console.log('Prepared public book data');
