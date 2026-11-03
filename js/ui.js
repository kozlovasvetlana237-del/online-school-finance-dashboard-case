import { demoData } from '../data/demo-data.js';
import { calculateModel } from './financial-engine.js';
import { calculateBudgetVariance, calculateControlChecks } from './analytics.js';

export function bootstrap() {
  return demoData;
}

const periodMap = {
  'Сентябрь 2026': ['2026-09'],
  '3 квартал 2026': ['2026-07', '2026-08', '2026-09'],
  '2026 YTD': demoData.periods.filter((period) => period.id.startsWith('2026-')).map((period) => period.id)
};

function money(value, digits = 1) {
  if (!Number.isFinite(value)) return 'н/д';
  return `${(value / 1000000).toFixed(digits).replace('.', ',')} млн ₽`;
}

function percent(value, digits = 1) {
  if (!Number.isFinite(value)) return 'н/д';
  return `${value.toFixed(digits).replace('.', ',')}%`;
}

function bind(key, value) {
  document.querySelectorAll(`[data-bind="${key}"]`).forEach((node) => { node.textContent = value; });
}

function selectedFilters() {
  const period = document.getElementById('period')?.value || 'Сентябрь 2026';
  const segment = document.getElementById('segment')?.value || 'ГК';
  const businessUnitId = segment === 'ГК' ? undefined : {
    'Основные курсы': 'core',
    'Премиум-программы': 'premium',
    'Дополнительные продукты': 'additional'
  }[segment];
  return { period, periodIds: periodMap[period], businessUnitId };
}

function renderTable(id, rows) {
  const body = document.getElementById(id);
  if (!body) return;
  body.innerHTML = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
}

export function renderDashboard(model, state = selectedFilters()) {
  const pl = model.profitAndLoss;
  const cf = model.cashFlow;
  const bs = model.balanceSheet;
  const checks = calculateControlChecks(model);
  const margin = pl.revenue === 0 ? null : pl.ebitda / pl.revenue * 100;
  const budgetPlan = demoData.budgets.filter((item) => state.periodIds.includes(item.periodId) && item.category === 'Выручка').reduce((sum, item) => sum + item.amount, 0);
  const budget = calculateBudgetVariance(budgetPlan, pl.revenue);

  bind('rev', money(pl.revenue));
  bind('ebitda', money(pl.ebitda));
  bind('ebitdaMargin', percent(margin));
  bind('ocf', money(cf.operating));
  bind('budgetExec', budgetPlan === 0 ? 'н/д' : percent(pl.revenue / budgetPlan * 100));
  bind('budgetExecDelta', budget.relative === null ? 'н/д' : `${budget.absolute >= 0 ? '+' : ''}${money(budget.absolute)}`);
  bind('yearForecast', money(pl.revenue));
  bind('freeCash', money(cf.closingCash));
  bind('actualRevenue', money(pl.revenue));
  bind('budgetRevenue', money(budgetPlan));
  bind('budgetVariance', budget.relative === null ? 'н/д' : `${budget.absolute >= 0 ? '+' : '−'}${money(Math.abs(budget.absolute))}`);
  bind('overviewScope', `${state.period} · единая модель`);

  renderTable('plBody', [
    ['Выручка', money(pl.revenue), percent(pl.revenue ? 100 : null)],
    ['Себестоимость образовательного продукта', `−${money(pl.costOfSales)}`, percent(pl.revenue ? pl.costOfSales / pl.revenue * 100 : null)],
    ['Валовая прибыль', money(pl.grossProfit), percent(pl.revenue ? pl.grossProfit / pl.revenue * 100 : null)],
    ['Маркетинг', `−${money(pl.marketing)}`, percent(pl.revenue ? pl.marketing / pl.revenue * 100 : null)],
    ['Продажи', `−${money(pl.sales)}`, percent(pl.revenue ? pl.sales / pl.revenue * 100 : null)],
    ['ФОТ', `−${money(pl.payroll)}`, percent(pl.revenue ? pl.payroll / pl.revenue * 100 : null)],
    ['Административные расходы', `−${money(pl.admin)}`, percent(pl.revenue ? pl.admin / pl.revenue * 100 : null)],
    ['EBITDA', money(pl.ebitda), percent(margin)]
  ]);
  renderTable('cfBody', [
    ['Операционная деятельность', money(cf.operating), 'расчёт по операциям'],
    ['Инвестиционная деятельность', money(cf.investing), 'расчёт по операциям'],
    ['Финансовая деятельность', money(cf.financing), 'расчёт по операциям'],
    ['Чистый денежный поток', money(cf.netCashFlow), 'итог'],
    ['Начальный остаток', money(cf.openingCash), 'контроль'],
    ['Конечный остаток', money(cf.closingCash), 'контроль']
  ]);
  renderTable('balBody', [
    ['Деньги', money(bs.cash), 'актив'],
    ['Дебиторская задолженность', money(bs.receivables), 'актив'],
    ['Прочие активы', money(bs.otherAssets), 'актив'],
    ['Основные средства и НМА', money(bs.fixedAssets), 'актив'],
    ['Предоплаты клиентов', money(bs.deferredRevenue), 'обязательство'],
    ['Собственный капитал', money(bs.equity), 'капитал'],
    ['Контроль: активы - обязательства - капитал', money(bs.balanceCheck), checks.balance === 0 ? 'OK' : 'ошибка']
  ]);
  renderTable('planFactBody', [
    ['Выручка', money(budget.plan), money(budget.actual), money(budget.absolute), budget.relative === null ? 'н/д' : percent(budget.relative)],
    ['Себестоимость', money(0), money(pl.costOfSales), money(pl.costOfSales), 'н/д'],
    ['Валовая прибыль', money(0), money(pl.grossProfit), money(pl.grossProfit), 'н/д'],
    ['Маркетинг', money(0), money(pl.marketing), money(pl.marketing), 'н/д'],
    ['ФОТ', money(0), money(pl.payroll), money(pl.payroll), 'н/д'],
    ['EBITDA', money(0), money(pl.ebitda), money(pl.ebitda), 'н/д']
  ]);
  const badge = document.getElementById('badge');
  if (badge) badge.textContent = `ДЕМО · ${state.period} · единая финансовая модель`;
  const caseBox = document.querySelector('.case-box p');
  if (caseBox) caseBox.textContent = 'Демонстрационная финансовая модель. Все данные являются условными и используются исключительно для иллюстрации функциональности системы. Выручка признаётся по мере оказания услуг, а ДДС рассчитывается по денежным операциям.';
}

if (typeof document !== 'undefined') {
  const update = () => {
    const state = selectedFilters();
    renderDashboard(calculateModel(demoData, state), state);
  };
  document.addEventListener('DOMContentLoaded', update, { once: true });
  document.querySelectorAll('select').forEach((element) => element.addEventListener('change', update));
}
