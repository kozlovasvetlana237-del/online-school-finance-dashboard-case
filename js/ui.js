import { demoData } from '../data/demo-data.js';
import { calculateModel, calculateRollingForecast } from './financial-engine.js';
import { calculateBudgetVariance, calculateControlChecks, calculateRevenueBridge, calculateEbitdaBridge, buildFinancialSignals, calculateUnitEconomics, calculateCohortMatrix, calculateLiquidityCalendar, calculateBudgetControl, loadBudgetControlState, saveBudgetControlState } from './analytics.js';

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

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const label = document.getElementById('themeLabel');
  const icon = document.getElementById('themeIcon');
  if (theme === 'light') {
    if (label) label.textContent = 'Тёмная тема';
    if (icon) icon.textContent = '🌙';
  } else {
    if (label) label.textContent = 'Светлая тема';
    if (icon) icon.textContent = '☀️';
  }
  try { localStorage.setItem('umschool_demo_theme', theme); } catch (error) { /* localStorage may be unavailable */ }
}

function initNavigation() {
  const tabs = document.querySelectorAll('.nav button[data-tab]');
  const sections = document.querySelectorAll('.tab');
  tabs.forEach((button) => button.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.toggle('active', item === button));
    sections.forEach((section) => section.classList.toggle('active', section.id === button.dataset.tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light'));
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('umschool_demo_theme') || 'dark'; } catch (error) { /* localStorage may be unavailable */ }
  applyTheme(savedTheme);
}

export function renderDashboard(model, state = selectedFilters()) {
  const pl = model.profitAndLoss;
  const cf = model.cashFlow;
  const bs = model.balanceSheet;
  const checks = calculateControlChecks(model);
  const margin = pl.revenue === 0 ? null : pl.ebitda / pl.revenue * 100;
  const budgetPlan = demoData.budgets.filter((item) => state.periodIds.includes(item.periodId) && item.category === 'Выручка').reduce((sum, item) => sum + item.amount, 0);
  const budget = calculateBudgetVariance(budgetPlan, pl.revenue);
  const driverMonth = demoData.drivers.months.find((month) => month.periodId === state.periodIds[state.periodIds.length - 1]) || demoData.drivers.months[0];
  const revenueBridge = calculateRevenueBridge(driverMonth.plan, driverMonth.actual);
  const toPl = (drivers) => {
    const revenue = drivers.leads * drivers.conversion / 100 * drivers.averageCheck * (1 - drivers.refunds);
    const costOfSales = drivers.directCosts;
    const ebitda = revenue - costOfSales - drivers.marketing - drivers.payroll - drivers.admin;
    return { revenue, costOfSales, marketing: drivers.marketing, sales: 0, payroll: drivers.payroll, admin: drivers.admin, ebitda };
  };
  const ebitdaBridge = calculateEbitdaBridge(toPl(driverMonth.plan), toPl(driverMonth.actual));
  const forecast = calculateRollingForecast(demoData, { lastClosedPeriodId: '2026-09', scenario: 'base' });
  const signals = buildFinancialSignals({ planFact: { marketing: calculateBudgetVariance(driverMonth.plan.marketing, driverMonth.actual.marketing, 'expense') }, forecast, model, thresholds: demoData.drivers.thresholds });

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
  const bridge = document.getElementById('varianceWaterfall');
  if (bridge) bridge.innerHTML = `<div class="signal"><div class="icon">Δ</div><div><b>Мост выручки: ${money(revenueBridge.totalVariance)}</b><p>Метод: последовательные подстановки. ${revenueBridge.factors.map((factor) => `${factor.label}: ${factor.impact >= 0 ? '+' : '−'}${money(Math.abs(factor.impact))}`).join(' · ')}</p></div></div><div class="signal"><div class="icon">E</div><div><b>Мост EBITDA: ${money(ebitdaBridge.totalVariance)}</b><p>Сумма факторов: ${money(ebitdaBridge.sumOfImpacts)}. Расхождение: ${money(ebitdaBridge.sumOfImpacts - ebitdaBridge.totalVariance)}.</p></div></div>`;
  const forecastChart = document.getElementById('forecastChart');
  if (forecastChart) forecastChart.innerHTML = forecast.months.map((month) => `<div class="bar-wrap"><div class="bar ${month.status === 'forecast' ? 'alt' : ''}" style="height:${Math.max(8, month.revenue / Math.max(...forecast.months.map((item) => item.revenue)) * 100)}%"></div><div class="bar-label">${month.periodId.slice(5)}<br><b>${money(month.revenue)}</b></div></div>`).join('');
  const scenarioBody = document.getElementById('scenarioBody');
  if (scenarioBody) scenarioBody.innerHTML = ['base', 'optimistic', 'conservative'].map((scenario) => { const result = calculateRollingForecast(demoData, { lastClosedPeriodId: '2026-09', scenario }); return `<tr><td>${scenario === 'base' ? 'Базовый' : scenario === 'optimistic' ? 'Оптимистичный' : 'Консервативный'}</td><td>${money(result.annual.revenue)}</td><td>${money(result.annual.ebitda)}</td><td>${money(result.annual.cashFlow)}</td><td>сценарный диапазон</td></tr>`; }).join('');
  const signalBox = document.getElementById('overviewSignals');
  if (signalBox) signalBox.innerHTML = (signals.length ? signals : [{ title: 'Критичных сигналов нет', problem: 'Пороговые правила не сработали', basis: 'по выбранному периоду', cause: 'данных для риска нет', consequence: 'не выявлено', action: 'продолжить мониторинг', owner: 'финансовый руководитель', status: 'наблюдение' }]).map((signal) => `<div class="signal"><div class="icon">!</div><div><b>${signal.title}</b><p>${signal.problem}. Основание: ${signal.basis}. Причина: ${signal.cause}. Действие: ${signal.action}. Ответственный: ${signal.owner}. Статус: ${signal.status}.</p></div></div>`).join('');
  const probabilityCard = document.querySelector('[data-bind="planProbability"]')?.closest('.card');
  if (probabilityCard) probabilityCard.style.display = 'none';
  const unitBody = document.getElementById('unitEconomicsBody');
  if (unitBody) unitBody.innerHTML = calculateUnitEconomics(demoData).map((item) => `<tr><td>${item.productName}</td><td>${item.buyers}</td><td>${money(item.revenue)}</td><td>${money(item.grossProfit)}</td><td>${item.cac === null ? 'н/д' : money(item.cac, 2)}</td><td>${item.ltvGrossProfit === null ? 'н/д' : money(item.ltvGrossProfit)}</td><td>${item.ltvCac === null ? 'н/д' : item.ltvCac.toFixed(2).replace('.', ',')}</td><td>${item.paybackPeriod || 'н/д'}</td></tr>`).join('');
  const metric = document.getElementById('cohortMetric')?.value || 'revenue';
  const cohortBody = document.getElementById('cohortBody');
  if (cohortBody) cohortBody.innerHTML = calculateCohortMatrix(demoData, metric).cohorts.map((cohort) => { const result = ['activeRetention', 'repeatPurchaseRetention'].includes(metric) ? cohort[metric] : cohort[metric]; return `<tr><td>${cohort.cohortMonth}</td><td>${cohort.newCustomers}</td><td>${cohort.repeatPurchases}</td><td>${cohort.activeRetention === null ? 'н/д' : percent(cohort.activeRetention)}</td><td>${cohort.repeatPurchaseRetention === null ? 'н/д' : percent(cohort.repeatPurchaseRetention)}</td><td>${money(cohort.averageRevenuePerCustomer)}</td><td>${result === null || result === undefined ? 'н/д' : ['activeRetention', 'repeatPurchaseRetention'].includes(metric) ? percent(result) : money(result)}</td></tr>`; }).join('');
  const horizon = Number(document.getElementById('treasuryHorizon')?.value || 30);
  const liquidity = calculateLiquidityCalendar(demoData, { startDate: '2026-10-01', horizonDays: horizon, minimumReserve: 1000000 });
  const cashChart = document.getElementById('cashChart');
  if (cashChart) { const maxCash = Math.max(...liquidity.days.map((day) => day.closingBalance), 1); cashChart.innerHTML = liquidity.days.filter((_, index) => index % Math.max(1, Math.floor(horizon / 8)) === 0).slice(0, 8).map((day) => `<div class="bar-wrap"><div class="bar ${day.belowReserve ? 'alt' : ''}" style="height:${Math.max(8, day.closingBalance / maxCash * 100)}%"></div><div class="bar-label">${day.date.slice(5)}<br><b>${money(day.closingBalance)}</b></div></div>`).join(''); }
  bind('treasuryMinimum', money(liquidity.minimumBalance));
  bind('treasuryReserve', money(1000000));
  bind('treasuryFreeCash', money(liquidity.freeCash));
  bind('treasuryGap', liquidity.cashGap ? `есть: ${liquidity.cashGapDates.length} дн.` : 'не выявлен');
  const treasuryBody = document.getElementById('paymentsBody');
  if (treasuryBody) treasuryBody.innerHTML = liquidity.days.slice(0, 14).map((day) => `<tr><td>${day.date}</td><td>${money(day.receipts)}</td><td>${money(day.payments)}</td><td>${money(day.closingBalance)}</td><td>${day.belowReserve ? 'кассовый разрыв' : 'в норме'}</td></tr>`).join('');
  const treasurySignals = document.getElementById('treasurySignals');
  if (treasurySignals) treasurySignals.innerHTML = `<div class="signal"><div class="icon">₽</div><div><b>Минимальный остаток: ${money(liquidity.minimumBalance)}</b><p>Горизонт: ${horizon} дней. Резерв: ${money(1000000)}. Свободные средства: ${money(liquidity.freeCash)}.</p></div></div><div class="signal"><div class="icon">!</div><div><b>${liquidity.cashGap ? 'Кассовый разрыв выявлен' : 'Кассовый разрыв не выявлен'}</b><p>Основание: проверены все ${horizon} календарных дней.</p></div></div>`;
  const controlKey = 'umschool_budget_control';
  const storedControl = loadBudgetControlState(typeof localStorage === 'undefined' ? null : localStorage, controlKey);
  const controlRows = calculateBudgetControl(demoData.budgetControl).map((record) => ({ ...record, ...storedControl[record.id] }));
  const controlBody = document.getElementById('budgetControlBody');
  if (controlBody) controlBody.innerHTML = controlRows.map((record) => { const unit = demoData.businessUnits.find((item) => item.id === record.businessUnitId); return `<tr><td>${unit?.name || record.businessUnitId}</td><td>${record.owner}</td><td><select data-budget-id="${record.id}" data-budget-field="preparationStatus"><option ${record.preparationStatus === 'готово' ? 'selected' : ''}>готово</option><option ${record.preparationStatus === 'в работе' ? 'selected' : ''}>в работе</option></select></td><td><select data-budget-id="${record.id}" data-budget-field="approvalStatus"><option ${record.approvalStatus === 'согласовано' ? 'selected' : ''}>согласовано</option><option ${record.approvalStatus === 'на согласовании' ? 'selected' : ''}>на согласовании</option></select></td><td>${record.plannedDate}</td><td>${record.scheduleStatus}</td><td>${record.correctiveAction}</td></tr>`; }).join('');
  document.querySelectorAll('[data-budget-id]').forEach((element) => element.addEventListener('change', () => { const state = loadBudgetControlState(localStorage, controlKey); state[element.dataset.budgetId] = { ...(state[element.dataset.budgetId] || {}), [element.dataset.budgetField]: element.value }; saveBudgetControlState(localStorage, controlKey, state); }));
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
  const init = () => {
    initNavigation();
    update();
    document.querySelectorAll('select').forEach((element) => element.addEventListener('change', update));
    document.getElementById('cohortMetric')?.addEventListener('change', update);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}
