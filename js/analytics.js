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

function unique(values) {
  return [...new Set(values)];
}

function productSales(data, productId) {
  return data.sales.filter((sale) => !productId || sale.productId === productId);
}

export function calculateUnitEconomics(data, filters = {}) {
  const products = data.products.filter((product) => !filters.productId || product.id === filters.productId);
  return products.map((product) => {
    const sales = productSales(data, product.id).filter((sale) => !filters.channelId || sale.channelId === filters.channelId);
    const customers = unique(sales.map((sale) => sale.customerId));
    const newCustomers = unique(sales.filter((sale) => !sale.isRepeatPurchase).map((sale) => sale.customerId));
    const revenue = sales.reduce((sum, sale) => sum + sale.grossAmount - sale.refundAmount, 0);
    const directCosts = sales.reduce((sum, sale) => sum + (data.directCostsByProduct[product.id] || 0), 0);
    const grossProfit = revenue - directCosts;
    const acquisition = data.acquisitionExpenses.filter((item) => item.productId === product.id && (!filters.channelId || item.channelId === filters.channelId)).reduce((sum, item) => sum + item.amount, 0);
    const cac = newCustomers.length ? acquisition / newCustomers.length : null;
    const ltvRevenue = newCustomers.length ? revenue / newCustomers.length : null;
    const ltvGrossProfit = newCustomers.length ? grossProfit / newCustomers.length : null;
    const ltvCac = cac && cac > 0 ? ltvGrossProfit / cac : null;
    const monthlyGrossProfit = new Map();
    sales.forEach((sale) => {
      const month = sale.date.slice(0, 7);
      monthlyGrossProfit.set(month, (monthlyGrossProfit.get(month) || 0) + sale.grossAmount - sale.refundAmount - (data.directCostsByProduct[product.id] || 0));
    });
    let cumulative = 0;
    const paybackPeriod = cac === null ? null : [...monthlyGrossProfit.entries()].sort(([a], [b]) => a.localeCompare(b)).find(([month, value]) => { cumulative += value / Math.max(1, newCustomers.length); return cumulative >= cac ? month : false; })?.[0] || null;
    return { productId: product.id, productName: product.name, buyers: customers.length, activeStudents: customers.length, averageCheck: sales.length ? revenue / sales.length : null, revenue, directCosts, grossProfit, contributionMargin: revenue ? grossProfit / revenue * 100 : null, newCustomers: newCustomers.length, cac, ltvRevenue, ltvGrossProfit, ltvCac, paybackPeriod };
  });
}

export function calculateCohortMatrix(data, metric = 'revenue') {
  const cohortMonths = unique(data.customers.map((customer) => customer.firstPaymentMonth)).sort();
  const observedMonths = new Set(data.sales.map((sale) => sale.date.slice(0, 7)));
  const cohorts = cohortMonths.map((cohortMonth) => {
    const cohortCustomers = data.customers.filter((customer) => customer.firstPaymentMonth === cohortMonth);
    const customerIds = new Set(cohortCustomers.map((customer) => customer.id));
    const cohortSales = data.sales.filter((sale) => customerIds.has(sale.customerId));
    const repeat = data.repeatPurchases.filter((purchase) => customerIds.has(purchase.customerId));
    const cumulativeRevenue = cohortSales.reduce((sum, sale) => sum + sale.grossAmount - sale.refundAmount, 0);
    const cumulativeGrossProfit = cohortSales.reduce((sum, sale) => sum + sale.grossAmount - sale.refundAmount - (data.directCostsByProduct[sale.productId] || 0), 0);
    const lastObserved = [...observedMonths].sort().at(-1);
    const activeCustomers = new Set(cohortSales.filter((sale) => sale.date.slice(0, 7) === lastObserved).map((sale) => sale.customerId)).size;
    const repeatCustomers = new Set(repeat.map((purchase) => purchase.customerId)).size;
    const values = { revenue: cumulativeRevenue, grossProfit: cumulativeGrossProfit, activeRetention: cohortCustomers.length ? activeCustomers / cohortCustomers.length * 100 : null, repeatPurchaseRetention: cohortCustomers.length ? repeatCustomers / cohortCustomers.length * 100 : null };
    return { cohortMonth, newCustomers: cohortCustomers.length, repeatPurchases: repeat.length, activeRetention: values.activeRetention, repeatPurchaseRetention: values.repeatPurchaseRetention, averageRevenuePerCustomer: cohortCustomers.length ? cumulativeRevenue / cohortCustomers.length : null, cumulativeRevenue, cumulativeGrossProfit, cumulativeCacPayback: values[metric] ?? null };
  });
  return { cohorts, metric };
}

function dateRange(startDate, horizonDays) {
  const start = new Date(`${startDate}T00:00:00Z`);
  return Array.from({ length: horizonDays }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400000);
    return date.toISOString().slice(0, 10);
  });
}

export function calculateLiquidityCalendar(data, { startDate = '2026-10-01', horizonDays = 30, payments = data.treasuryPayments, minimumReserve = 1000000 } = {}) {
  const dates = dateRange(startDate, horizonDays);
  let balance = data.openingBalances.cash;
  const days = dates.map((date) => {
    const receipts = data.treasuryReceipts.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0);
    const paymentTotal = payments.filter((item) => item.date === date).reduce((sum, item) => sum + item.amount, 0);
    const openingBalance = balance;
    balance += receipts - paymentTotal;
    return { date, openingBalance, receipts, payments: paymentTotal, closingBalance: balance, belowReserve: balance < minimumReserve };
  });
  const gapDays = days.filter((day) => day.belowReserve);
  const mandatoryPayments = payments.filter((payment) => payment.mandatory && dates.includes(payment.date)).reduce((sum, payment) => sum + payment.amount, 0);
  return { days, minimumBalance: Math.min(...days.map((day) => day.closingBalance)), cashGap: gapDays.length > 0, cashGapDates: gapDays.map((day) => day.date), mandatoryPayments, freeCash: Math.max(0, balance - mandatoryPayments - minimumReserve) };
}

export function calculateBudgetControl(records, now = new Date().toISOString().slice(0, 10)) {
  return records.map((record) => {
    const dueDate = new Date(`${record.plannedDate}T00:00:00Z`).getTime();
    const actualDate = record.actualDate ? new Date(`${record.actualDate}T00:00:00Z`).getTime() : new Date(`${now}T00:00:00Z`).getTime();
    const delayDays = Math.max(0, Math.round((actualDate - dueDate) / 86400000));
    return { ...record, delayDays, isOverdue: !record.actualDate && delayDays > 0, scheduleStatus: delayDays > 0 ? 'просрочено' : 'в срок' };
  });
}

export function loadBudgetControlState(storage, key = 'umschool_budget_control') {
  try { return JSON.parse(storage?.getItem(key) || '{}'); } catch (error) { return {}; }
}

export function saveBudgetControlState(storage, key, state) {
  try { storage?.setItem(key, JSON.stringify(state)); } catch (error) { return false; }
  return true;
}

export function resetBudgetControlState(storage, key = 'umschool_budget_control') {
  try { storage?.removeItem(key); } catch (error) { return false; }
  return true;
}

export { calculateModel };
