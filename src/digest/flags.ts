import type { DigestRow } from './types.js';

// A row needs a look when it kept retrying or its last run failed.
export const RETRY_FLAG_AT = 3;

export function isFlagged(row: DigestRow): boolean {
  return row.retries >= RETRY_FLAG_AT || row.lastStatus === 'fail';
}
