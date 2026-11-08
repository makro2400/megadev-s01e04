import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest page', () => {
  it('renders the 2026-10-28 night as a table', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('<th>job</th>');
    expect(html).toContain('lane/sync');
    expect(html).toContain('1 unreadable lines skipped');
  });

  it('404s for a night with no file', async () => {
    const res = await createApp(config).request('/digest/2001-01-01');
    expect(res.status).toBe(404);
  });

  it('says nothing ran for an empty file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'digest-'));
    writeFileSync(join(dir, '2026-01-02.jsonl'), '');
    const res = await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('flags retries >= 3 and failed last status with text, and shows — for nulls', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'digest-'));
    writeFileSync(
      join(dir, '2026-01-03.jsonl'),
      [
        '{"at":"2026-01-03T01:00:00+01:00","job":"a/retry","status":"retry","owner":null,"error":"boom"}',
        '{"at":"2026-01-03T01:01:00+01:00","job":"a/retry","status":"retry"}',
        '{"at":"2026-01-03T01:02:00+01:00","job":"a/retry","status":"retry"}',
        '{"at":"2026-01-03T02:00:00+01:00","job":"b/fail","status":"fail","owner":"rook"}',
        '{"at":"2026-01-03T03:00:00+01:00","job":"c/ok","status":"ok","owner":"rook"}',
      ].join('\n'),
    );
    const html = await (await createApp({ ...config, runsDir: dir }).request('/digest/2026-01-03')).text();
    expect(html.match(/<tr class="warn">/g)?.length).toBe(2);
    expect(html).toContain('fail · flagged');
    expect(html).toContain('<td>—</td>');
    expect(html).toContain('<td>c/ok</td>');
  });
});
