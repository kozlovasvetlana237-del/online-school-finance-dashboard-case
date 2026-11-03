import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../data/demo-data.js';
import { calculateModel, calculateProfitAndLoss, calculateCashFlow } from '../js/financial-engine.js';
import { calculateBudgetVariance, calculateControlChecks, calculateAnnualForecast, formatRelativeVariance } from '../js/analytics.js';

test('financial model has no invalid numbers', () => {
  const model = calculateModel(demoData, { periodIds: ['2026-09'] });
  const checks = calculateControlChecks(model);
  assert.equal(checks.noInvalidNumbers, true);
  assert.equal(checks.balance, 0);
  assert.equal(checks.cash, 0);
  assert.equal(checks.ebitda, 0);
  assert.equal(checks.grossProfit, 0);
});

test('cash closing balance equals opening plus net cash flow', () => {
  const cash = calculateCashFlow(demoData, { periodIds: ['2026-09'] });
  assert.equal(cash.closingCash, cash.openingCash + cash.netCashFlow);
});

test('gross profit and EBITDA reconcile to P&L', () => {
  const pl = calculateProfitAndLoss(demoData, { periodIds: ['2026-09'] });
  assert.equal(pl.grossProfit, pl.revenue - pl.costOfSales);
  assert.equal(pl.ebitda, pl.grossProfit - pl.marketing - pl.sales - pl.payroll - pl.admin);
});

test('budget variance handles zero plan without infinity', () => {
  const variance = calculateBudgetVariance(0, 100);
  assert.equal(variance.relative, null);
  assert.equal(formatRelativeVariance(100, 0), null);
});

test('annual forecast is fact plus remaining forecast', () => {
  const result = calculateAnnualForecast([{ periodId: 'a', value: 10 }, { periodId: 'b', value: 20 }], ['a']);
  assert.equal(result.annualTotal, result.closedFact + result.remainingForecast);
});

test('expense overrun is unfavorable', () => {
  assert.equal(calculateBudgetVariance(100, 120, 'expense').favorable, false);
  assert.equal(calculateBudgetVariance(100, 80, 'expense').favorable, true);
});

test('prepayment remains deferred until service is delivered', () => {
  const data = {
    ...demoData,
    periods: [{ id: '2026-01', month: '2026-01', status: 'closed' }, { id: '2026-02', month: '2026-02', status: 'forecast' }],
    sales: [{ id: 'prepayment', date: '2026-01-10', productId: 'core-course', channelId: 'content', grossAmount: 42000, paidAmount: 42000, refundAmount: 0, serviceStart: '2026-02-01', serviceEnd: '2026-02-28' }],
    expenses: [],
    cashOperations: [{ id: 'prepayment-cash', date: '2026-01-10', type: 'operating', direction: 'inflow', amount: 42000, sourceId: 'prepayment' }],
    openingBalances: { cash: 0, receivables: 0, otherAssets: 0, fixedAssets: 0, payables: 0, deferredRevenue: 0, otherLiabilities: 0, equity: 0 }
  };
  const model = calculateModel(data, { periodIds: ['2026-01'] });
  assert.equal(model.profitAndLoss.revenue, 0);
  assert.equal(model.balanceSheet.deferredRevenue, 42000);
});

test('refund reduces recognized revenue and cash inflow', () => {
  const data = {
    ...demoData,
    periods: [{ id: '2026-01', month: '2026-01', status: 'closed' }],
    sales: [{ id: 'refund', date: '2026-01-10', productId: 'core-course', channelId: 'content', grossAmount: 42000, paidAmount: 42000, refundAmount: 10000, serviceStart: '2026-01-01', serviceEnd: '2026-01-28' }],
    expenses: [],
    cashOperations: [{ id: 'refund-cash', date: '2026-01-10', type: 'operating', direction: 'inflow', amount: 32000, sourceId: 'refund' }],
    openingBalances: { cash: 0, receivables: 0, otherAssets: 0, fixedAssets: 0, payables: 0, deferredRevenue: 0, otherLiabilities: 0, equity: 0 }
  };
  const model = calculateModel(data, { periodIds: ['2026-01'] });
  assert.equal(model.profitAndLoss.revenue, 32000);
  assert.equal(model.cashFlow.operating, 32000);
});

test('installment creates receivable without changing recognized revenue', () => {
  const data = {
    ...demoData,
    periods: [{ id: '2026-01', month: '2026-01', status: 'closed' }],
    sales: [{ id: 'installment', date: '2026-01-10', productId: 'core-course', channelId: 'content', grossAmount: 42000, paidAmount: 21000, refundAmount: 0, serviceStart: '2026-01-01', serviceEnd: '2026-01-28' }],
    expenses: [],
    cashOperations: [{ id: 'installment-cash', date: '2026-01-10', type: 'operating', direction: 'inflow', amount: 21000, sourceId: 'installment' }],
    openingBalances: { cash: 0, receivables: 0, otherAssets: 0, fixedAssets: 0, payables: 0, deferredRevenue: 0, otherLiabilities: 0, equity: 0 }
  };
  const model = calculateModel(data, { periodIds: ['2026-01'] });
  assert.equal(model.profitAndLoss.revenue, 42000);
  assert.equal(model.balanceSheet.receivables, 21000);
  assert.equal(model.balanceSheet.balanceCheck, 0);
});

test('higher teaching cost reduces EBITDA', () => {
  const base = calculateProfitAndLoss(demoData, { periodIds: ['2026-09'] });
  const changed = { ...demoData, expenses: demoData.expenses.map((expense) => expense.category === 'Преподавание' && expense.date.startsWith('2026-09') ? { ...expense, amount: expense.amount * 2 } : expense) };
  const increased = calculateProfitAndLoss(changed, { periodIds: ['2026-09'] });
  assert.ok(increased.ebitda < base.ebitda);
});

test('moving a payment out of the selected period changes cash only', () => {
  const base = calculateCashFlow(demoData, { periodIds: ['2026-09'] });
  const moved = { ...demoData, cashOperations: demoData.cashOperations.map((operation) => operation.date === '2026-09-01' ? { ...operation, date: '2026-10-01' } : operation) };
  const changed = calculateCashFlow(moved, { periodIds: ['2026-09'] });
  assert.notEqual(changed.operating, base.operating);
});
