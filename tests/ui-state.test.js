import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPaymentDateOverride, nextTheme, readCustomDrivers, readFilterState } from '../js/ui-state.js';

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
    unit: { value: 'Продажи' },
    product: { value: 'premium-course' },
    comparisonPeriod: { value: '3 квартал 2025' },
    viewMode: { value: 'Прогноз' }
  }, { periods: [{ id: '2026-01' }, { id: '2025-12' }] });
  assert.deepEqual(state.periodIds, ['2026-01']);
  assert.equal(state.businessUnitId, 'premium');
  assert.equal(state.scenario, 'optimistic');
  assert.equal(state.unit, 'Продажи');
  assert.equal(state.productId, 'premium-course');
  assert.equal(state.comparisonPeriod, '3 квартал 2025');
  assert.deepEqual(state.comparisonPeriodIds, ['2025-07', '2025-08', '2025-09']);
  assert.equal(state.viewMode, 'Прогноз');
});

test('readFilterState falls back safely for unknown values', () => {
  const state = readFilterState({}, { periods: [{ id: '2026-01' }] });
  assert.equal(state.period, 'Сентябрь 2026');
  assert.deepEqual(state.periodIds, ['2026-09']);
  assert.equal(state.businessUnitId, undefined);
  assert.equal(state.scenario, 'base');
});

test('custom drivers are read from controls and payment date override is immutable', () => {
  const drivers = readCustomDrivers({ fmLeads: { value: '1000' }, fmConversion: { value: '12' } }, { averageCheck: 42000, marketing: 10, payroll: 20, admin: 5 });
  assert.deepEqual(drivers, { leads: 1000, conversion: 12, averageCheck: 42000, marketing: 10, payroll: 20, admin: 5 });
  const payments = [{ id: 'p1', date: '2026-10-05', amount: 100 }];
  const moved = applyPaymentDateOverride(payments, 'p1', '2026-10-15');
  assert.equal(moved[0].date, '2026-10-15');
  assert.equal(payments[0].date, '2026-10-05');
});

