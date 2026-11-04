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
  'Консервативный сценарий': 'conservative'
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
  return {
    period,
    periodIds,
    businessUnitId: segmentIds[segment],
    scenario: scenarioIds[elements.scenario?.value] || 'base',
    unit: elements.unit?.value || 'Все подразделения'
  };
}

