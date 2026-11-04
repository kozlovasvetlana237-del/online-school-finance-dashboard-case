import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTheme, readFilterState } from '../js/ui-state.js';

test('nextTheme alternates only supported themes', () => {
  assert.equal(nextTheme('dark'), 'light');
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('unexpected'), 'light');
});

test('readFilterState maps selected period and segment', () => {
  const state = readFilterState({
    period: { value: '2026 YTD' },
    scenario: { value: 'Оптимистичный сценарий' },
    segment: { value: 'Премиум-программы' },
    unit: { value: 'Продажи' }
  }, { periods: [{ id: '2026-01' }, { id: '2025-12' }] });
  assert.deepEqual(state.periodIds, ['2026-01']);
  assert.equal(state.businessUnitId, 'premium');
  assert.equal(state.scenario, 'optimistic');
  assert.equal(state.unit, 'Продажи');
});

test('readFilterState falls back safely for unknown values', () => {
  const state = readFilterState({}, { periods: [{ id: '2026-01' }] });
  assert.equal(state.period, 'Сентябрь 2026');
  assert.deepEqual(state.periodIds, ['2026-09']);
  assert.equal(state.businessUnitId, undefined);
  assert.equal(state.scenario, 'base');
});

