import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest JSON', () => {
  it('returns the night as JSON', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    const body = (await res.json()) as { rows: { job: string }[]; badLines: number };
    expect(res.status).toBe(200);
    expect(body.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(body.badLines).toBe(1);
  });

  it('404s on a missing or malformed night', async () => {
    for (const n of ['2026-01-01', 'nope']) {
      const res = await createApp(config).request(`/api/digest/${n}`);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'no such night', night: n });
    }
  });
});
