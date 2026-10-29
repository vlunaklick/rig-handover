// Plan morning-digest § 1. The contract every part of § 2 builds against.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, after parsing at the edge.
export type RunLine = {
  at: string; // ISO 8601 with the log's own offset; never converted to UTC
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as '—'
  runs: number; // lines for this job
  retries: number; // lines with status 'retry'
  lastStatus: RunStatus;
  lastError: string | null; // error of the last line that had one; null renders as '—'
  firstAt: string; // as written in the log
  lastAt: string; // as written in the log
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job, so the page and the JSON share one order
  counts: { ok: number; retry: number; fail: number }; // parsed lines by status, bad lines excluded
  badLines: number; // lines that didn't parse: counted, never thrown
};

// Implemented in src/digest/read.ts as `readNight`.
// Returns null when runs/<night>.jsonl doesn't exist; an empty file gives rows: [].
export type ReadNight = (runsDir: string, night: string) => Night | null;
