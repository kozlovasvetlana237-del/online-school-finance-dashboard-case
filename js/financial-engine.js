const DAY = 24 * 60 * 60 * 1000;

function inPeriod(date, periodIds) {
  return !periodIds || periodIds.includes(String(date).slice(0, 7));
}

function selectedSales(data, filters = {}) {
  const productIds = filters.productId ? [filters.productId] : null;
  return data.sales.filter((sale) => inPeriod(sale.date, filters.periodIds) &&
    (!filters.productId || productIds.includes(sale.productId)) &&
    (!filters.businessUnitId || data.products.find((p) => p.id === sale.productId)?.businessUnitId === filters.businessUnitId));
}

function serviceShare(sale, periodId) {
  const start = new Date(`${sale.serviceStart}T00:00:00Z`).getTime();
  const end = new Date(`${sale.serviceEnd}T00:00:00Z`).getTime();
  const monthStart = new Date(`${periodId}-01T00:00:00Z`).getTime();
  const monthEnd = new Date(`${periodId}-28T23:59:59Z`).getTime();
  if (end <= monthStart || start > monthEnd || end <= start) return 0;
  const overlapStart = Math.max(start, monthStart);
  const overlapEnd = Math.min(end, monthEnd);
  return Math.max(0, Math.min(1, (overlapEnd - overlapStart + DAY) / (end - start + DAY)));
}

export function calculateRevenue(data, filters = {}) {
  return data.sales.reduce((sum, sale) => {
    const periodId = String(sale.date).slice(0, 7);
    if (!inPeriod(sale.date, filters.periodIds)) return sum;
    if (filters.productId && sale.productId !== filters.productId) return sum;
    const product = data.products.find((item) => item.id === sale.productId);
    if (filters.businessUnitId && product?.businessUnitId !== filters.businessUnitId) return sum;
    const months = filters.periodIds || [periodId];
    const share = months.reduce((total, id) => total + serviceShare(sale, id), 0);
    return sum + Math.max(0, sale.grossAmount - sale.refundAmount) * Math.min(1, share);
  }, 0);
}

function filteredExpenses(data, filters = {}) {
  return data.expenses.filter((expense) => inPeriod(expense.date, filters.periodIds) &&
    (!filters.businessUnitId || expense.businessUnitId === filters.businessUnitId) &&
    (!filters.category || expense.category === filters.category));
}

export function calculateCostOfSales(data, filters = {}) {
  return filteredExpenses(data, filters).filter((expense) => expense.type === 'direct').reduce((sum, item) => sum + item.amount, 0);
}

export function calculateProfitAndLoss(data, filters = {}) {
  const revenue = calculateRevenue(data, filters);
  const expenses = filteredExpenses(data, filters);
  const byCategory = (category) => expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
  const costOfSales = expenses.filter((item) => item.type === 'direct').reduce((sum, item) => sum + item.amount, 0);
  const marketing = byCategory('Маркетинг');
  const sales = byCategory('Продажи');
  const payroll = byCategory('ФОТ');
  const admin = byCategory('Административные расходы');
  const grossProfit = revenue - costOfSales;
  const ebitda = grossProfit - marketing - sales - payroll - admin;
  const depreciation = 0;
  const ebit = ebitda - depreciation;
  const interest = 0;
  // налоги в демо-данных не оплачиваются и не выделены отдельной операцией,
  // поэтому не создаём искусственное обязательство или расхождение с ДДС.
  const taxes = 0;
  return { revenue, costOfSales, grossProfit, marketing, sales, payroll, admin, ebitda, depreciation, ebit, interest, taxes, netProfit: ebit - interest - taxes };
}

export function calculateCashFlow(data, filters = {}) {
  const openingCash = data.openingBalances.cash;
  const operations = data.cashOperations.filter((operation) => inPeriod(operation.date, filters.periodIds));
  const amount = (type) => operations.filter((item) => item.type === type).reduce((sum, item) => sum + (item.direction === 'inflow' ? item.amount : -item.amount), 0);
  const operating = amount('operating');
  const investing = amount('investing');
  const financing = amount('financing');
  const netCashFlow = operating + investing + financing;
  return { openingCash, operating, investing, financing, netCashFlow, closingCash: openingCash + netCashFlow };
}

export function calculateBalanceSheet(data, filters = {}) {
  const cashFlow = calculateCashFlow(data, filters);
  const pl = calculateProfitAndLoss(data, filters);
  const sales = selectedSales(data, filters);
  const periodIds = filters.periodIds || data.periods.map((period) => period.id);
  const recognized = sales.reduce((sum, sale) => {
    const share = periodIds.reduce((total, periodId) => total + serviceShare(sale, periodId), 0);
    return sum + Math.max(0, sale.grossAmount - sale.refundAmount) * Math.min(1, share);
  }, 0);
  const received = sales.reduce((sum, sale) => sum + sale.paidAmount - sale.refundAmount, 0);
  const receivables = data.openingBalances.receivables + Math.max(0, recognized - received);
  const deferredRevenue = data.openingBalances.deferredRevenue + Math.max(0, received - recognized);
  const otherAssets = data.openingBalances.otherAssets;
  const fixedAssets = data.openingBalances.fixedAssets;
  const totalAssets = cashFlow.closingCash + receivables + otherAssets + fixedAssets;
  const payables = data.openingBalances.payables;
  const otherLiabilities = data.openingBalances.otherLiabilities;
  const equity = data.openingBalances.equity + pl.netProfit;
  const totalLiabilitiesAndEquity = payables + deferredRevenue + otherLiabilities + equity;
  return { cash: cashFlow.closingCash, receivables, otherAssets, fixedAssets, totalAssets, payables, deferredRevenue, otherLiabilities, equity, totalLiabilitiesAndEquity, balanceCheck: totalAssets - totalLiabilitiesAndEquity };
}

export function calculateModel(data, filters = {}) {
  const profitAndLoss = calculateProfitAndLoss(data, filters);
  const cashFlow = calculateCashFlow(data, filters);
  const balanceSheet = calculateBalanceSheet(data, filters);
  return { profitAndLoss, cashFlow, balanceSheet, recognizedRevenue: profitAndLoss.revenue, deferredRevenue: balanceSheet.deferredRevenue, periodResults: [] };
}

export function calculateManagementView(data, filters = {}, { mode = 'Факт', scenario = 'base' } = {}) {
  if (mode === 'Факт') return calculateModel(data, filters);
  const sourceKey = mode === 'План' ? 'plan' : 'forecast';
  const months = data.drivers.months.filter((month) => !filters.periodIds || filters.periodIds.includes(month.periodId));
  const selected = months.length ? months : data.drivers.months;
  const rows = selected.map((month) => {
    const source = sourceKey === 'plan' ? month.plan : scenarioDrivers(month.forecast, scenario);
    const revenue = source.leads * source.conversion / 100 * source.averageCheck * (1 - source.refunds);
    return { revenue, costOfSales: source.directCosts, marketing: source.marketing, sales: 0, payroll: source.payroll, admin: source.admin };
  });
  const sum = (key) => rows.reduce((total, row) => total + row[key], 0);
  const revenue = sum('revenue');
  const costOfSales = sum('costOfSales');
  const marketing = sum('marketing');
  const sales = sum('sales');
  const payroll = sum('payroll');
  const admin = sum('admin');
  const grossProfit = revenue - costOfSales;
  const ebitda = grossProfit - marketing - sales - payroll - admin;
  const netCashFlow = ebitda;
  const profitAndLoss = { revenue, costOfSales, grossProfit, marketing, sales, payroll, admin, ebitda, depreciation: 0, ebit: ebitda, interest: 0, taxes: 0, netProfit: ebitda };
  const cashFlow = { openingCash: data.openingBalances.cash, operating: netCashFlow, investing: 0, financing: 0, netCashFlow, closingCash: data.openingBalances.cash + netCashFlow };
  const balanceSheet = { cash: null, receivables: null, otherAssets: null, fixedAssets: null, totalAssets: null, payables: null, deferredRevenue: null, otherLiabilities: null, equity: null, totalLiabilitiesAndEquity: null, balanceCheck: null };
  return { profitAndLoss, cashFlow, balanceSheet, recognizedRevenue: revenue, deferredRevenue: null, periodResults: [] };
}

function scenarioDrivers(drivers, scenario, customDrivers = {}) {
  const factor = scenario === 'optimistic' ? { leads: 1.08, conversion: 1.08, averageCheck: 1.03 } : scenario === 'conservative' ? { leads: 0.92, conversion: 0.94, averageCheck: 0.98 } : { leads: 1, conversion: 1, averageCheck: 1 };
  const source = scenario === 'custom' ? { ...drivers, ...customDrivers } : drivers;
  return { ...source, leads: source.leads * factor.leads, conversion: source.conversion * factor.conversion, averageCheck: source.averageCheck * factor.averageCheck };
}

export function calculateRollingForecast(data, { lastClosedPeriodId = '2026-09', scenario = 'base', customDrivers = {} } = {}) {
  const months = data.drivers.months.map((month) => {
    const isFact = month.periodId <= lastClosedPeriodId;
    const source = isFact ? month.actual : scenarioDrivers(month.forecast, scenario, customDrivers);
    const revenue = source.leads * source.conversion / 100 * source.averageCheck * (1 - source.refunds);
    const ebitda = revenue - source.directCosts - source.marketing - source.payroll - source.admin;
    const budgetRevenue = month.plan.leads * month.plan.conversion / 100 * month.plan.averageCheck * (1 - month.plan.refunds);
    const previous = data.drivers.previousForecast.find((item) => item.periodId === month.periodId);
    return { periodId: month.periodId, status: isFact ? 'fact' : 'forecast', revenue, ebitda, cashFlow: revenue - source.marketing - source.directCosts - source.payroll - source.admin, budgetRevenue, previousForecastRevenue: previous?.revenue ?? null };
  });
  const sum = (key) => months.reduce((total, month) => total + month[key], 0);
  const budget = sum('budgetRevenue');
  const revenue = sum('revenue');
  return { months, annual: { revenue, ebitda: sum('ebitda'), cashFlow: sum('cashFlow') }, shortfallPercent: budget === 0 ? 0 : Math.max(0, (budget - revenue) / budget * 100) };
}

