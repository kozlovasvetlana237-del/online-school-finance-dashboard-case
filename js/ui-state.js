const periodMap = {
  'Сентябрь 2026': ['2026-09'],
  '3 квартал 2026': ['2026-07', '2026-08', '2026-09']
};

const segmentIds = {
  'Основные курсы': 'core',
  'Премиум-программы': 'premium',
  'Дополнительные продукты': 'additional'
};

const scenarioIds = {
  'Базовый сценарий': 'base',
  'Оптимистичный сценарий': 'optimistic',
  'Консервативный сценарий': 'conservative',
  'Пользовательский сценарий': 'custom'
};

export function nextTheme(theme) {
  return theme === 'light' ? 'dark' : 'light';
}

export function readFilterState(elements = {}, data = { periods: [] }) {
  const period = elements.period?.value || 'Сентябрь 2026';
  const periodIds = periodMap[period] || (period === '2026 YTD'
    ? data.periods.filter((item) => item.id.startsWith('2026-')).map((item) => item.id)
    : []);
  const segment = elements.segment?.value || 'ГК';
  const comparisonPeriod = elements.comparisonPeriod?.value || 'Предыдущий период';
  const viewMode = elements.viewMode?.value || 'Факт';
  return {
    period,
    periodIds,
    businessUnitId: segmentIds[segment],
    scenario: scenarioIds[elements.scenario?.value] || 'base',
    unit: elements.unit?.value || 'Все подразделения',
    productId: elements.product?.value && elements.product.value !== 'all' ? elements.product.value : undefined,
    comparisonPeriod,
    viewMode
  };
}

export function readCustomDrivers(elements = {}, fallback = {}) {
  const number = (id, fallbackValue) => {
    const value = Number(elements[id]?.value);
    return Number.isFinite(value) ? value : fallbackValue;
  };
  return {
    leads: number('fmLeads', fallback.leads),
    conversion: number('fmConversion', fallback.conversion),
    averageCheck: number('fmAvgCheck', fallback.averageCheck),
    marketing: number('fmMarketing', fallback.marketing),
    payroll: number('fmPayroll', fallback.payroll),
    admin: number('fmOtherCosts', fallback.admin)
  };
}

export function loadLocalState(storage, key, fallback = {}) {
  try { return { ...fallback, ...JSON.parse(storage?.getItem(key) || '{}') }; } catch (error) { return { ...fallback }; }
}

export function saveLocalState(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
}

export function applyPaymentDateOverride(payments, paymentId, newDate) {
  return payments.map((payment) => payment.id === paymentId ? { ...payment, date: newDate } : { ...payment });
}

