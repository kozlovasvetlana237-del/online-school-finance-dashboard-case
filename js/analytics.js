import { calculateModel } from './financial-engine.js';

export function filterData(data, filters = {}) {
  const periodIds = filters.periodIds || data.periods.map((period) => period.id);
  return { ...data, periods: data.periods.filter((period) => periodIds.includes(period.id)), sales: data.sales.filter((sale) => periodIds.includes(sale.date.slice(0, 7))), expenses: data.expenses.filter((expense) => periodIds.includes(expense.date.slice(0, 7))), cashOperations: data.cashOperations.filter((item) => periodIds.includes(item.date.slice(0, 7))) };
}

export function formatRelativeVariance(actual, plan) {
  return plan === 0 ? null : (actual - plan) / Math.abs(plan) * 100;
}

export function calculateBudgetVariance(plan, actual, kind = 'income') {
  const absolute = actual - plan;
  const relative = formatRelativeVariance(actual, plan);
  const favorable = kind === 'expense' ? absolute <= 0 : absolute >= 0;
  return { plan, actual, absolute, relative, favorable };
}

export function calculateAnnualForecast(periodResults, closedPeriodIds) {
  const closed = periodResults.filter((item) => closedPeriodIds.includes(item.periodId));
  const remaining = periodResults.filter((item) => !closedPeriodIds.includes(item.periodId));
  const sum = (items) => items.reduce((total, item) => total + item.value, 0);
  const closedFact = sum(closed);
  const remainingForecast = sum(remaining);
  return { closedFact, remainingForecast, annualTotal: closedFact + remainingForecast };
}

export function calculateControlChecks(model) {
  const pl = model.profitAndLoss;
  const cf = model.cashFlow;
  const bs = model.balanceSheet;
  const checks = {
    balance: bs.balanceCheck,
    cash: cf.closingCash - (cf.openingCash + cf.netCashFlow),
    ebitda: pl.ebitda - (pl.grossProfit - pl.marketing - pl.sales - pl.payroll - pl.admin),
    grossProfit: pl.grossProfit - (pl.revenue - pl.costOfSales),
    annualForecast: 0,
    noInvalidNumbers: Object.values({ ...pl, ...cf, ...bs }).every(Number.isFinite)
  };
  return { ...checks, allPassed: Object.values(checks).every((value) => value === true || value === 0) };
}

export { calculateModel };
