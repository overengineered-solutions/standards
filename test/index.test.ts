import { describe, expect, it } from 'vitest';

import { listRules, readStandard } from '../src/index';

describe('standards api', () => {
  it('listRules returns an array', () => {
    const rules = listRules();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(0);
  });

  it('readStandard reads AI_STANDARDS markdown', async () => {
    const content = await readStandard('AI_STANDARDS');

    expect(typeof content).toBe('string');
    expect(/AI_STANDARDS|rule/i.test(content)).toBe(true);
  });
});
