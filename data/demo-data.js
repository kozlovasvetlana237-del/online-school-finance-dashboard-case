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

export const demoData = {
  periods,
  businessUnits,
  products,
  channels,
  sales,
  expenses,
  cashOperations,
  budgets,
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
