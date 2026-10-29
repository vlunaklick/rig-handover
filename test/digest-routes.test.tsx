import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night } from '../src/digest/types.js';

const line = (at: string, job: string, status: string, owner: string | null, error?: string) =>
  JSON.stringify({ at, job, status, owner, ...(error ? { error } : {}) });

let runsDir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  const normal = [
    line('2026-10-28T02:00:00+01:00', 'zeta/job', 'ok', 'ana'),
    line('2026-10-28T02:05:00+01:00', 'alpha/job', 'retry', null, 'boom'),
    line('2026-10-28T02:10:00+01:00', 'alpha/job', 'ok', 'bo'),
  ];
  writeFileSync(join(runsDir, '2026-10-01.jsonl'), normal.join('\n') + '\n');
  writeFileSync(join(runsDir, '2026-10-02.jsonl'), '');
  writeFileSync(
    join(runsDir, '2026-10-03.jsonl'),
    [normal[0], '{not json', normal[1]].join('\n') + '\n',
  );
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });
});

afterAll(() => rmSync(runsDir, { recursive: true, force: true }));

const json = async (night: string) => (await app.request(`/api/digest/${night}`)).json() as Promise<Night>;

describe('GET /digest/:night', () => {
  it('200 for an existing night', async () => {
    const res = await app.request('/digest/2026-10-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('alpha/job');
    expect(html).toContain('zeta/job');
  });

  it('404 for a night with no file', async () => {
    expect((await app.request('/digest/2026-10-09')).status).toBe(404);
  });

  it('empty night says nothing ran', async () => {
    const res = await app.request('/digest/2026-10-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('bad line night still renders the good rows', async () => {
    const res = await app.request('/digest/2026-10-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('zeta/job');
    expect(html).toContain('alpha/job');
    expect(html).toContain('1 line didn&#39;t parse');
  });
});

describe('GET /api/digest/:night', () => {
  it('200 for an existing night', async () => {
    const res = await app.request('/api/digest/2026-10-01');
    expect(res.status).toBe(200);
    const body = await json('2026-10-01');
    expect(body.rows.map((r) => r.job)).toEqual(['alpha/job', 'zeta/job']);
    expect(body.badLines).toBe(0);
  });

  it('404 for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-10-09')).status).toBe(404);
  });

  it('empty night has no rows and no bad lines', async () => {
    const res = await app.request('/api/digest/2026-10-02');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Night;
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('bad line night counts the line and keeps the good rows', async () => {
    const res = await app.request('/api/digest/2026-10-03');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Night;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['alpha/job', 'zeta/job']);
  });
});

describe('page and JSON agree', () => {
  it.each(['2026-10-01', '2026-10-03'])('same jobs in the same order for %s', async (night) => {
    const html = await (await app.request(`/digest/${night}`)).text();
    const jobs = (await json(night)).rows.map((r) => r.job);
    expect(jobs.length).toBeGreaterThan(0);
    const positions = jobs.map((j) => html.indexOf(`<td>${j}</td>`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect([...html.matchAll(/<td>([a-z]+\/job)<\/td>/g)].map((m) => m[1])).toEqual(jobs);
  });
});
