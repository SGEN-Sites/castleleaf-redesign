// fetch-images.mjs - download a fixed list of client image URLs (exact URLs found in the captured HTML; never guessed,
// so no 404 can trip the host's firewall). One request at a time, a pause between, identifying UA; 401/403/429 stops.
// Files land in --out with their own names (Elementor thumb hashes dropped). Magic bytes are checked: an HTML body
// answered with 200 is recorded as a failure, never saved as an image.
//   node tools/fetch-images.mjs --list <urls.txt> --out <dir> [--delay 400]
import fs from 'node:fs';
import path from 'node:path';
const a = Object.fromEntries(process.argv.slice(2).reduce((r, v, i, arr) => (v.startsWith('--') ? r.concat([[v.slice(2), arr[i + 1]]]) : r), []));
const list = fs.readFileSync(a.list, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
fs.mkdirSync(a.out, { recursive: true });
const UA = 'site-reforge/1.0 (redesign pitch research; static fetch)';
const sig = (b) => (b[0] === 0xff && b[1] === 0xd8 ? 'jpg' : b[0] === 0x89 && b[1] === 0x50 ? 'png' : b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' ? 'webp' : b.slice(0, 3).toString() === 'GIF' ? 'gif' : null);
const rec = {};
for (const u of list) {
  let name = decodeURIComponent(u.split('/').pop()).replace(/-r0c8[a-z0-9]+(\.\w+)$/, '$1').replace(/-scaled(\.\w+)$/, '$1');
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    const b = Buffer.from(await r.arrayBuffer());
    const kind = r.status === 200 ? sig(b) : null;
    if (r.status === 200 && kind) { fs.writeFileSync(path.join(a.out, name), b); rec[name] = { url: u, bytes: b.length, kind }; console.log('ok', r.status, kind, b.length, name); }
    else { rec[name] = { url: u, status: r.status, kind, failed: true }; console.log('FAIL', r.status, kind, name); }
    if ([401, 403, 429].includes(r.status)) { console.log('STOP'); break; }
  } catch (e) { rec[name] = { url: u, error: String(e.message || e) }; console.log('ERR', name, e.message); }
  await new Promise((s) => setTimeout(s, Number(a.delay || 400)));
}
fs.writeFileSync(path.join(a.out, '_sources.json'), JSON.stringify(rec, null, 1));
