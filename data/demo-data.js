const months = [
  ['2025-01', 'closed'], ['2025-02', 'closed'], ['2025-03', 'closed'],
  ['2025-04', 'closed'], ['2025-05', 'closed'], ['2025-06', 'closed'],
  ['2025-07', 'closed'], ['2025-08', 'closed'], ['2025-09', 'closed'],
  ['2025-10', 'closed'], ['2025-11', 'closed'], ['2025-12', 'closed'],
  ['2026-01', 'closed'], ['2026-02', 'closed'], ['2026-03', 'closed'],
  ['2026-04', 'closed'], ['2026-05', 'closed'], ['2026-06', 'closed'],
  ['2026-07', 'closed'], ['2026-08', 'closed'], ['2026-09', 'closed'],
  ['2026-10', 'forecast'], ['2026-11', 'forecast'], ['2026-12', 'forecast']
];

const periods = months.map(([id, status]) => ({ id, month: id, status }));
const businessUnits = [
  { id: 'core', name: 'Основные программы' },
  { id: 'premium', name: 'Премиум-программы' },
  { id: 'additional', name: 'Дополнительные продукты' }
];
const products = [
  { id: 'core-course', businessUnitId: 'core', name: 'Основная программа', price: 42000, serviceMonths: 3 },
  { id: 'premium-course', businessUnitId: 'premium', name: 'Премиум-программа', price: 95000, serviceMonths: 4 },
  { id: 'additional-course', businessUnitId: 'additional', name: 'Дополнительный модуль', price: 18000, serviceMonths: 1 }
];
const channels = [
  { id: 'content', name: 'Контент' },
  { id: 'paid', name: 'Платная реклама' },
  { id: 'partners', name: 'Партнёрские продажи' }
];

const sales = [];
for (let i = 0; i < 24; i += 1) {
  const period = periods[i];
  products.forEach((product, productIndex) => {
    const count = 18 + (i % 5) * 2 + productIndex * 4;
    for (let j = 0; j < count; j += 1) {
      const day = String((j % 20) + 1).padStart(2, '0');
      const date = `${period.id}-${day}`;
      const paidAmount = product.price;
      sales.push({
        id: `${period.id}-${product.id}-${j}`,
        date,
        productId: product.id,
        channelId: channels[(j + productIndex) % channels.length].id,
        grossAmount: paidAmount,
        paidAmount,
        refundAmount: i === 8 && j === 0 ? Math.round(paidAmount * 0.5) : 0,
        serviceStart: date,
        serviceEnd: `${period.id}-${String(Math.min(28, 20 + product.serviceMonths * 2)).padStart(2, '0')}`
      });
    }
  });
}

const expenses = periods.flatMap(({ id }) => [
  { id: `${id}-teachers`, date: `${id}-25`, businessUnitId: 'core', category: 'Преподавание', amount: 330000, type: 'direct', paidDate: `${id}-25` },
  { id: `${id}-review`, date: `${id}-26`, businessUnitId: 'core', category: 'Проверка домашних заданий', amount: 90000, type: 'direct', paidDate: `${id}-26` },
  { id: `${id}-platform`, date: `${id}-27`, businessUnitId: 'core', category: 'Платформа', amount: 70000, type: 'direct', paidDate: `${id}-27` },
  { id: `${id}-marketing`, date: `${id}-10`, businessUnitId: 'core', category: 'Маркетинг', amount: 230000, type: 'indirect', paidDate: `${id}-10` },
  { id: `${id}-sales`, date: `${id}-20`, businessUnitId: 'core', category: 'Продажи', amount: 110000, type: 'indirect', paidDate: `${id}-20` },
  { id: `${id}-payroll`, date: `${id}-28`, businessUnitId: 'core', category: 'ФОТ', amount: 280000, type: 'indirect', paidDate: `${id}-28` },
  { id: `${id}-admin`, date: `${id}-29`, businessUnitId: 'core', category: 'Административные расходы', amount: 80000, type: 'indirect', paidDate: `${id}-29` }
]);

const cashOperations = [
  ...sales.map((sale) => ({ id: `${sale.id}-cash`, date: sale.date, type: 'operating', direction: 'inflow', amount: sale.paidAmount - sale.refundAmount, sourceId: sale.id })),
  ...expenses.map((expense) => ({ id: `${expense.id}-cash`, date: expense.paidDate, type: 'operating', direction: 'outflow', amount: expense.amount, sourceId: expense.id }))
];

const budgets = periods.map((period) => [
  { periodId: period.id, businessUnitId: 'core', category: 'Выручка', amount: 2600000 },
  { periodId: period.id, businessUnitId: 'core', category: 'Маркетинг', amount: 230000 },
  { periodId: period.id, businessUnitId: 'core', category: 'ФОТ', amount: 280000 },
  { periodId: period.id, businessUnitId: 'core', category: 'Административные расходы', amount: 80000 }
]).flat();

const driverMonths = Array.from({ length: 12 }, (_, index) => {
  const periodId = `2026-${String(index + 1).padStart(2, '0')}`;
  const status = index < 9 ? 'closed' : 'forecast';
  const plan = { leads: 9200 + index * 180, conversion: 8.8 + index * 0.08, averageCheck: 42000 + index * 500, refunds: 0.035, marketing: 230000 + index * 5000, directCosts: 490000, payroll: 280000, admin: 80000 };
  const actual = { ...plan, leads: 9000 + index * 220, conversion: 8.6 + index * 0.1, averageCheck: 41500 + index * 650, refunds: index === 8 ? 0.06 : 0.025, marketing: 225000 + index * 6500 };
  const forecast = { ...plan, leads: 9800 + index * 240, conversion: 9.1 + index * 0.1, averageCheck: 43000 + index * 700, refunds: 0.025, marketing: 235000 + index * 5500 };
  return { periodId, status, plan, actual, forecast };
});

const previousForecast = driverMonths.map(({ periodId, plan }) => ({
  periodId,
  revenue: plan.leads * plan.conversion / 100 * plan.averageCheck * (1 - plan.refunds),
  ebitda: plan.leads * plan.conversion / 100 * plan.averageCheck * (1 - plan.refunds) - plan.directCosts - plan.marketing - plan.payroll - plan.admin
}));

const customers = [];
const repeatPurchases = [];
sales.forEach((sale, index) => {
  const customerId = `demo-customer-${String(index % 180).padStart(3, '0')}`;
  const firstPaymentMonth = customers.find((customer) => customer.id === customerId)?.firstPaymentMonth || sale.date.slice(0, 7);
  sale.customerId = customerId;
  sale.firstPaymentMonth = firstPaymentMonth;
  sale.isRepeatPurchase = firstPaymentMonth !== sale.date.slice(0, 7);
  if (!customers.some((customer) => customer.id === customerId)) customers.push({ id: customerId, firstPaymentMonth, productId: sale.productId, channelId: sale.channelId });
  if (sale.isRepeatPurchase) repeatPurchases.push({ id: `repeat-${sale.id}`, customerId, date: sale.date, productId: sale.productId, amount: sale.paidAmount, refundAmount: sale.refundAmount });
});

const acquisitionExpenses = periods.map((period) => channels.map((channel, index) => ({ periodId: period.id, channelId: channel.id, productId: products[index % products.length].id, amount: 75000 + index * 25000 }))).flat();
const directCostsByProduct = { 'core-course': 16000, 'premium-course': 36000, 'additional-course': 6000 };
const treasuryReceipts = Array.from({ length: 9 }, (_, index) => ({ id: `receipt-${index}`, date: `2026-${String(10 + Math.floor(index / 3)).padStart(2, '0')}-${String((index % 3) * 10 + 5).padStart(2, '0')}`, category: 'Поступления клиентов', amount: 450000, confirmed: index < 3 }));
const treasuryPayments = [
  { id: 'payroll-1', date: '2026-10-05', category: 'ФОТ', amount: 280000, mandatory: true, priority: 'critical', approvalStatus: 'approved' },
  { id: 'platform-1', date: '2026-10-08', category: 'Платформа', amount: 70000, mandatory: true, priority: 'high', approvalStatus: 'approved' },
  { id: 'marketing-1', date: '2026-10-12', category: 'Маркетинг', amount: 230000, mandatory: false, priority: 'high', approvalStatus: 'pending' },
  { id: 'tax-1', date: '2026-10-20', category: 'Налоги', amount: 150000, mandatory: true, priority: 'critical', approvalStatus: 'scheduled' },
  { id: 'contractor-1', date: '2026-11-05', category: 'Подрядчики', amount: 420000, mandatory: true, priority: 'high', approvalStatus: 'pending' },
  { id: 'investment-1', date: '2026-11-15', category: 'Инвестиции', amount: 500000, mandatory: false, priority: 'medium', approvalStatus: 'pending' },
  { id: 'payroll-2', date: '2026-12-05', category: 'ФОТ', amount: 280000, mandatory: true, priority: 'critical', approvalStatus: 'scheduled' }
];
const budgetControl = businessUnits.map((unit, index) => ({
  id: `budget-${unit.id}`,
  businessUnitId: unit.id,
  owner: ['Руководитель FP&A', 'Руководитель продукта', 'Руководитель продаж'][index],
  preparationStatus: index === 0 ? 'готово' : 'в работе',
  approvalStatus: index === 0 ? 'согласовано' : 'на согласовании',
  plannedDate: `2026-10-${String(10 + index * 5).padStart(2, '0')}`,
  actualDate: index === 0 ? '2026-10-09' : null,
  variance: index === 0 ? 'нет' : 'срок под угрозой',
  correctiveAction: index === 0 ? 'поддерживать календарь' : 'назначить встречу с владельцем бюджета',
  actionDueDate: `2026-10-${String(20 + index * 3).padStart(2, '0')}`
}));

export const demoData = {
  periods,
  businessUnits,
  products,
  channels,
  sales,
  expenses,
  cashOperations,
  budgets,
  drivers: {
    months: driverMonths,
    previousForecast,
    thresholds: {
      marketingOverrunPercent: 5,
      ebitdaMarginMinimum: 20,
      forecastShortfallPercent: 3,
      refundRateMaximum: 5
    }
  },
  customers,
  repeatPurchases,
  acquisitionExpenses,
  directCostsByProduct,
  treasuryReceipts,
  treasuryPayments,
  budgetControl,
  openingBalances: {
    cash: 2500000,
    receivables: 0,
    otherAssets: 120000,
    fixedAssets: 380000,
    payables: 0,
    deferredRevenue: 0,
    otherLiabilities: 0,
    equity: 3000000
  }
};
