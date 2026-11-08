import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

function tempRuns(night: string, body: string) {
  const dir = mkdtempSync(join(tmpdir(), 'digest-routes-'));
  writeFileSync(join(dir, `${night}.jsonl`), body);
  return { ...base, runsDir: dir };
}

const GOOD = '{"at":"2026-01-05T01:00:00+01:00","job":"b/job","status":"ok","owner":"rook"}';
const GOOD_A = '{"at":"2026-01-05T02:00:00+01:00","job":"a/job","status":"retry","owner":null,"error":"x"}';

describe.each([
  ['page', '/digest/'],
  ['json', '/api/digest/'],
])('digest %s', (_name, prefix) => {
  it('200 for a night on disk', async () => {
    const res = await createApp(tempRuns('2026-01-05', `${GOOD}\n`)).request(`${prefix}2026-01-05`);
    expect(res.status).toBe(200);
  });

  it('404 for a night with no file', async () => {
    const res = await createApp(tempRuns('2026-01-05', GOOD)).request(`${prefix}2026-01-06`);
    expect(res.status).toBe(404);
  });
});

describe('empty night', () => {
  const cfg = tempRuns('2026-01-07', '');
  it('page says nothing ran', async () => {
    const res = await createApp(cfg).request('/digest/2026-01-07');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
  it('json has no rows', async () => {
    const res = await createApp(cfg).request('/api/digest/2026-01-07');
    expect(await res.json()).toEqual({ night: '2026-01-07', rows: [], badLines: 0 });
  });
});

describe('night with a bad line', () => {
  const cfg = tempRuns('2026-01-08', `${GOOD}\nnot json\n${GOOD_A}\n`);
  it('page still renders and notes the skipped line', async () => {
    const res = await createApp(cfg).request('/digest/2026-01-08');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('1 unreadable lines skipped');
  });
  it('json counts the bad line', async () => {
    const body = (await (await createApp(cfg).request('/api/digest/2026-01-08')).json()) as { badLines: number; rows: unknown[] };
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(2);
  });
});

describe('page and json agree', () => {
  it('same jobs in the same order for 2026-10-28', async () => {
    const app = createApp({ ...base, runsDir: 'runs' });
    const json = (await (await app.request('/api/digest/2026-10-28')).json()) as { rows: { job: string }[] };
    const html = await (await app.request('/digest/2026-10-28')).text();
    const jobs = json.rows.map((r) => r.job);
    const positions = jobs.map((j) => html.indexOf(`<td>${j}</td>`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
