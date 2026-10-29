import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  const night = readNight('runs', '2026-10-28');

  it('reads one row per job, sorted by job, and counts the bad line', () => {
    expect(night).not.toBeNull();
    expect(night?.night).toBe('2026-10-28');
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(night?.badLines).toBe(1);
  });

  it('counts lines by status, bad lines excluded', () => {
    expect(night?.counts).toEqual({ ok: 10, retry: 4, fail: 1 });
    expect(readNight('runs', '2026-10-27')?.counts).toEqual({ ok: 7, retry: 0, fail: 0 });
  });

  it('counts retries and keeps the last status', () => {
    const row = night?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(row).toMatchObject({
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: 'upstream 503',
      firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00',
    });
  });

  it('keeps the failure and its error', () => {
    const row = night?.rows.find((r) => r.job === 'notes/backup');
    expect(row).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded', owner: 'lane-07' });
  });

  it('keeps a null owner and times as written', () => {
    const row = night?.rows.find((r) => r.job === 'digest/render');
    expect(row?.owner).toBeNull();
    expect(row?.lastError).toBeNull();
    expect(row?.firstAt).toBe('2026-10-29T05:41:09+01:00');
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });

  describe('empty night', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    it('gives no rows and no bad lines', () => {
      writeFileSync(join(dir, '2026-01-01.jsonl'), '');
      expect(readNight(dir, '2026-01-01')).toEqual({ night: '2026-01-01', rows: [], counts: { ok: 0, retry: 0, fail: 0 }, badLines: 0 });
    });
  });
});
