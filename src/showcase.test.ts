import { describe, expect, it } from 'vitest';
import { demos, groups } from './demos';
import { eventNames, record } from './events';

describe('the showcase', () => {
  it('shows every method of the SDK exactly once', () => {
    const shown = Object.values(groups).flat();
    expect(new Set(shown).size).toBe(shown.length);
    expect([...shown].sort()).toEqual(Object.keys(demos).sort());
  });

  it('listens to every event once', () => {
    expect(new Set(eventNames).size).toBe(eventNames.length);
    expect(eventNames).toContain('notificationAction');
  });

  it('keeps the newest events first, at most the limit', () => {
    let log = record([], { at: '1', event: 'focus', data: {} }, 2);
    log = record(log, { at: '2', event: 'blur', data: {} }, 2);
    log = record(log, { at: '3', event: 'focus', data: {} }, 2);
    expect(log.map((entry) => entry.at)).toEqual(['3', '2']);
  });
});
