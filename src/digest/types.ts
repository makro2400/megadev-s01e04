export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as —
  runs: number; // lines for this job
  retries: number; // lines with status "retry"
  lastStatus: RunStatus;
  lastError: string | null; // error of the last line that had one
  firstAt: string; // ISO 8601 with the offset from the log
  lastAt: string;
};

export type DigestNight = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse, counted not thrown
};

// null when runs/<night>.jsonl does not exist; an empty file gives rows: [].
export type ReadNight = (runsDir: string, night: string) => DigestNight | null;
