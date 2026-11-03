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

function driverRevenue(drivers) {
  return drivers.leads * drivers.conversion / 100 * drivers.averageCheck * (1 - drivers.refunds);
}

export function calculateRevenueBridge(planDrivers, actualDrivers) {
  const keys = [
    ['leads', 'Лиды'],
    ['conversion', 'Конверсия'],
    ['averageCheck', 'Средний чек'],
    ['refunds', 'Возвраты']
  ];
  const base = { ...planDrivers };
  const planRevenue = driverRevenue(base);
  let previous = planRevenue;
  const factors = keys.map(([key, label]) => {
    const next = { ...base, [key]: actualDrivers[key] };
    const value = driverRevenue(next);
    const impact = value - previous;
    base[key] = actualDrivers[key];
    previous = value;
    return { key, label, impact, method: 'sequential_substitution' };
  });
  return { planRevenue, actualRevenue: previous, totalVariance: previous - planRevenue, factors, method: 'sequential_substitution' };
}

export function calculateEbitdaBridge(planPl, actualPl) {
  const factors = [
    { key: 'revenue', label: 'Отклонение признанной выручки', impact: actualPl.revenue - planPl.revenue },
    { key: 'costOfSales', label: 'Отклонение себестоимости', impact: -(actualPl.costOfSales - planPl.costOfSales) },
    { key: 'marketing', label: 'Отклонение маркетинга', impact: -(actualPl.marketing - planPl.marketing) },
    { key: 'payroll', label: 'Отклонение ФОТ', impact: -(actualPl.payroll - planPl.payroll) },
    { key: 'otherOperating', label: 'Отклонение прочих расходов', impact: -((actualPl.sales + actualPl.admin) - (planPl.sales + planPl.admin)) }
  ];
  const totalVariance = actualPl.ebitda - planPl.ebitda;
  return { totalVariance, factors, sumOfImpacts: factors.reduce((sum, factor) => sum + factor.impact, 0) };
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

export function buildFinancialSignals({ planFact, forecast, model, thresholds }) {
  const signals = [];
  const marketing = planFact?.marketing;
  if (marketing && marketing.relative !== null && marketing.relative > thresholds.marketingOverrunPercent) {
    signals.push({ id: 'marketing-overrun', title: 'Превышение бюджета маркетинга', problem: 'Факт маркетинга выше плана', basis: `${marketing.relative.toFixed(1)}%`, cause: 'подтверждено план-факт данными', consequence: 'снижение EBITDA', action: 'проверить кампании и перераспределить бюджет', owner: 'руководитель маркетинга', status: 'к действию', severity: 'warning' });
  }
  const margin = model?.profitAndLoss?.revenue ? model.profitAndLoss.ebitda / model.profitAndLoss.revenue * 100 : null;
  if (margin !== null && margin < thresholds.ebitdaMarginMinimum) {
    signals.push({ id: 'margin-risk', title: 'Низкая EBITDA margin', problem: 'Маржинальность ниже порога', basis: `${margin.toFixed(1)}%`, cause: 'недостаточно данных для детализации причины', consequence: 'снижение запаса финансовой устойчивости', action: 'провести анализ себестоимости и расходов', owner: 'финансовый руководитель', status: 'требует анализа', severity: 'bad' });
  }
  if (forecast?.shortfallPercent > thresholds.forecastShortfallPercent) {
    signals.push({ id: 'forecast-shortfall', title: 'Риск недовыполнения прогноза', problem: 'Прогноз ниже утверждённого бюджета', basis: `${forecast.shortfallPercent.toFixed(1)}%`, cause: forecast.cause || 'недостаточно данных для детализации причины', consequence: 'недополучение выручки', action: 'обновить драйверы продаж и план действий', owner: 'руководитель продаж', status: forecast.cause ? 'к действию' : 'требует анализа', severity: 'bad' });
  }
  return signals;
}

export { calculateModel };
