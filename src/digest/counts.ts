import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RunStatus } from './types.js';

// Per-line counts for one night. Counts lines, not jobs.
export type NightCounts = Record<RunStatus, number>;

const STATUSES: readonly string[] = ['ok', 'retry', 'fail'];

// null when runs/<night>.jsonl does not exist. Lines that do not parse, or
// have no valid status, are ignored (the digest reader counts them instead).
export function countNight(runsDir: string, night: string): NightCounts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    let v: unknown;
    try {
      v = JSON.parse(raw);
    } catch {
      continue;
    }
    if (typeof v !== 'object' || v === null) continue;
    const status = (v as Record<string, unknown>).status;
    if (typeof status !== 'string' || !STATUSES.includes(status)) continue;
    counts[status as RunStatus]++;
  }
  return counts;
}
