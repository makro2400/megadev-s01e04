// Saves one digest page as a self-contained HTML file (ADR 0003). Runs the app in-process:
// no server, no browser. The banner shows LANE_MARKER; run with LANE_MARKER unset (or empty)
// to get the clean copy that goes over the same link after review.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createApp } from '../src/app.js';
import { lane } from '../src/lane.js';

const night = process.argv[2] ?? '2026-10-28';
const outfile = process.argv[3] ?? `var/preview/digest-${night}.html`;

const res = await createApp().request(`/digest/${night}`);
if (res.status !== 200) {
  console.error(`preview failed: /digest/${night} returned ${res.status}`);
  process.exit(1);
}

const html = await res.text();
await mkdir(dirname(outfile), { recursive: true });
await writeFile(outfile, html);

console.log(`wrote ${outfile}`);
console.log(`banner marker: ${lane().marker !== null ? 'yes' : 'no (no marker set)'}`);
