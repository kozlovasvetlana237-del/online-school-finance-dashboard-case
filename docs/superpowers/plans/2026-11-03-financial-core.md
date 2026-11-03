
# Финансовое ядро этапа 1 Implementation Plan

> **Для агентной реализации:** выполнять задачи последовательно, после каждой задачи запускать указанные проверки и фиксировать отдельный коммит.

**Цель:** заменить разрозненные демонстрационные коэффициенты единой финансовой моделью онлайн-школы и доказать её согласованность автоматическими тестами.

**Архитектура:** статическое приложение на нативных ES-модулях без сборщика. Исходные операции находятся в data/demo-data.js, расчёты в js/financial-engine.js, аналитика и проверки в js/analytics.js, браузерная интеграция в js/ui.js. Текущий интерфейс и визуальная концепция сохраняются.

**Технологический стек:** HTML, CSS, JavaScript ES2022, Node.js built-in test runner, GitHub Pages.

## Глобальные ограничения

- не создавать новый проект;
- сохранить текущий дизайн, палитру, типографику, светлую и тёмную темы;
- весь интерфейс остаётся на русском языке;
- не использовать платные сервисы или обязательный сервер;
- приложение должно работать через GitHub Pages;
- все демонстрационные данные маркировать как условные;
- не использовать независимые коэффициенты для основных финансовых показателей;
- не подгонять капитал для искусственного равенства баланса;
- при нулевой базе возвращать null, а интерфейсу показывать н/д;
- не переходить к этапам 2-5 до завершения критических тестов этапа 1.

## Карта файлов

- Создать: data/demo-data.js - исходные синтетические операции и начальные остатки.
- Создать: js/financial-engine.js - признание выручки, ОПиУ, ДДС, баланс и модель.
- Создать: js/analytics.js - фильтры, план-факт, прогнозная агрегация и проверки.
- Создать: js/ui.js - состояние UI, обработчики и отрисовка.
- Создать: tests/financial-engine.test.js - тесты финансового ядра.
- Создать: package.json - скрипт test без внешних зависимостей.
- Создать: styles.css - перенос текущего CSS без визуальной смены.
- Изменить: index.html - подключение модулей и сохранение текущей разметки.
- Создать: AUDIT.md - итоговый аудит и ограничения.

### Task 1: тестовый каркас и модульные границы

**Файлы:**
- Create: package.json
- Create: data/demo-data.js
- Create: js/financial-engine.js
- Create: js/analytics.js
- Create: js/ui.js
- Create: tests/financial-engine.test.js
- Modify: index.html

**Интерфейсы:**
- data/demo-data.js экспортирует demoData.
- financial-engine.js экспортирует расчётные функции.
- analytics.js экспортирует filterData, calculateBudgetVariance, calculateControlChecks.
- ui.js импортирует demoData и аналитические функции.

- [ ] Шаг 1: создать package.json

`json
{
  "name": "online-school-finance-dashboard-case",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js"
  }
}
`

- [ ] Шаг 2: создать минимальные ES-модули

`js
// data/demo-data.js
export const demoData = Object.freeze({});

// js/financial-engine.js
export function calculateModel() {
  throw new Error('financial engine is not implemented');
}

// js/analytics.js
export function filterData(data) {
  return data;
}

// js/ui.js
import { demoData } from '../data/demo-data.js';
import { filterData } from './analytics.js';

export function bootstrap() {
  return filterData(demoData);
}
`

- [ ] Шаг 3: подключить js/ui.js через script type="module" и убрать старый inline JavaScript после переноса логики.

- [ ] Шаг 4: добавить smoke-тест импорта

`js
import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../data/demo-data.js';
import { bootstrap } from '../js/ui.js';

test('modules import without browser globals', () => {
  assert.deepEqual(bootstrap(), demoData);
});
`

- [ ] Шаг 5: выполнить npm test. Ожидается PASS для smoke-теста.
- [ ] Шаг 6: выполнить commit с сообщением chore: establish financial core module boundaries.

### Task 2: синтетические исходные данные

**Файлы:**
- Modify: data/demo-data.js
- Modify: tests/financial-engine.test.js

**Интерфейс demoData:**

`js
{
  periods: Array<{ id, month, status }>,
  businessUnits: Array<{ id, name }>,
  products: Array<{ id, businessUnitId, name, price, serviceMonths }>,
  channels: Array<{ id, name }>,
  sales: Array<{
    id, date, productId, channelId, grossAmount,
    paidAmount, refundAmount, serviceStart, serviceEnd
  }>,
  expenses: Array<{
    id, date, businessUnitId, category, amount,
    type, paidDate
  }>,
  cashOperations: Array<{
    id, date, type, direction, amount, sourceId
  }>,
  budgets: Array<{ periodId, businessUnitId, category, amount }>,
  openingBalances: {
    cash, receivables, otherAssets, fixedAssets,
    payables, deferredRevenue, otherLiabilities, equity
  }
}
`

- [ ] Шаг 1: добавить 24 последовательных месяца: 12 закрытых месяцев предыдущего года и 12 месяцев текущего года с разделением факта и прогноза.
- [ ] Шаг 2: добавить условные бизнес-юниты, продукты, каналы и разные длительности услуг.
- [ ] Шаг 3: добавить полную оплату, рассрочку, предоплату, частично оказанную услугу и возврат.
- [ ] Шаг 4: добавить прямые расходы преподавания, проверки, платформы и косвенные маркетинговые, продажные, ФОТ и административные расходы.
- [ ] Шаг 5: добавить операционные, инвестиционные и финансовые денежные операции, начальные остатки и бюджеты.
- [ ] Шаг 6: добавить в тесты небольшие фикстуры для предоплаты, оказания услуги, возврата, роста маркетинговых расходов, роста стоимости преподавания и переноса платежа.
- [ ] Шаг 7: выполнить npm test. До реализации двигателя допускается ожидаемый FAIL предметных тестов.
- [ ] Шаг 8: выполнить commit с сообщением feat: add coherent synthetic finance data.

### Task 3: расчётный финансовый двигатель

**Файлы:**
- Modify: js/financial-engine.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
export function calculateRevenue(data, filters = {}) -> number
export function calculateCostOfSales(data, filters = {}) -> number
export function calculateProfitAndLoss(data, filters = {}) -> {
  revenue, costOfSales, grossProfit, marketing,
  sales, payroll, admin, ebitda, depreciation,
  ebit, interest, taxes, netProfit
}
export function calculateCashFlow(data, filters = {}) -> {
  openingCash, operating, investing, financing,
  netCashFlow, closingCash
}
export function calculateBalanceSheet(data, filters = {}) -> {
  cash, receivables, otherAssets, fixedAssets,
  totalAssets, payables, deferredRevenue,
  otherLiabilities, equity, totalLiabilitiesAndEquity,
  balanceCheck
}
export function calculateModel(data, filters = {}) -> {
  profitAndLoss, cashFlow, balanceSheet,
  periodResults, recognizedRevenue, deferredRevenue
}
`

- [ ] Шаг 1: написать тест, что предоплата без оказания услуги даёт нулевую признанную выручку и положительное обязательство.
- [ ] Шаг 2: реализовать признание выручки по датам и доле оказания услуги. Не заменять операции процентами от общей выручки.
- [ ] Шаг 3: написать тесты валовой прибыли и EBITDA:

`js
assert.equal(pl.grossProfit, pl.revenue - pl.costOfSales);
assert.equal(
  pl.ebitda,
  pl.grossProfit - pl.marketing - pl.sales - pl.payroll - pl.admin
);
`

- [ ] Шаг 4: реализовать ОПиУ, отдельно учитывая прямые и косвенные расходы.
- [ ] Шаг 5: написать тест ДДС:

`js
assert.equal(cf.closingCash, cf.openingCash + cf.netCashFlow);
assert.notEqual(cf.operating, pl.revenue);
`

- [ ] Шаг 6: реализовать ДДС только по cashOperations с разделением operating, investing и financing.
- [ ] Шаг 7: написать тест баланса:

`js
assert.equal(bs.balanceCheck, 0);
assert.equal(bs.totalAssets, bs.totalLiabilitiesAndEquity);
`

- [ ] Шаг 8: реализовать активы, обязательства и капитал без остаточной корректировки капитала.
- [ ] Шаг 9: обработать пустые наборы, нулевые базы, отрицательные возвраты и платежи.
- [ ] Шаг 10: выполнить npm test. Ожидается PASS всех тестов двигателя.
- [ ] Шаг 11: выполнить commit с сообщением feat: implement coherent financial engine.

### Task 4: аналитический слой и контрольные равенства

**Файлы:**
- Modify: js/analytics.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
export function filterData(data, filters) -> filteredData
export function calculateBudgetVariance(plan, actual) -> {
  plan, actual, absolute, relative, favorable
}
export function calculateAnnualForecast(periodResults, closedPeriodIds) -> {
  closedFact, remainingForecast, annualTotal
}
export function calculateControlChecks(model) -> {
  balance, cash, ebitda, grossProfit,
  annualForecast, noInvalidNumbers, allPassed
}
export function formatRelativeVariance(actual, plan) -> number | null
`

- [ ] Шаг 1: написать тесты фильтрации по периоду, бизнес-юниту и продукту. Проверить неизменность исходных данных.
- [ ] Шаг 2: реализовать чистую фильтрацию без коэффициентов и мутаций.
- [ ] Шаг 3: написать тест план-факт, включая null при нулевом плане и раздельный favorable для доходов и расходов.
- [ ] Шаг 4: реализовать абсолютное отклонение actual - plan и корректную благоприятность расходов.
- [ ] Шаг 5: написать тест closedFact + remainingForecast = annualTotal.
- [ ] Шаг 6: реализовать контрольные проверки с числовым отклонением и статусом.
- [ ] Шаг 7: добавить тесты роста маркетинга, стоимости преподавания, возвратов, снижения конверсии и изменения драйвера.
- [ ] Шаг 8: выполнить npm test. Ожидается PASS всех аналитических тестов.
- [ ] Шаг 9: выполнить commit с сообщением feat: add financial analytics and control checks.

### Task 5: подключение текущего интерфейса

**Файлы:**
- Create: styles.css
- Modify: index.html
- Modify: js/ui.js
- Modify: js/analytics.js

**Интерфейсы:**

`js
export function createUiState() -> {
  periodId, comparisonPeriodId,
  businessUnitId, productId, viewMode
}
export function renderDashboard(model, state) -> void
export function formatMoney(value) -> string
export function formatPercent(value) -> string
export function formatAvailability(value, reason) -> string
`

- [ ] Шаг 1: вынести текущий CSS в styles.css и подключить его относительным путём без изменения значений палитры.
- [ ] Шаг 2: перенести тему и сохранить localStorage key umschool_demo_theme.
- [ ] Шаг 3: заменить baseData, scenarioFactor, segmentFactor и unitFactor как источники KPI расчётным состоянием модели.
- [ ] Шаг 4: подключить KPI выручки, EBITDA, EBITDA Margin, операционного денежного потока, конечных денег, исполнения бюджета и годового прогноза.
- [ ] Шаг 5: подключить таблицы ОПиУ, ДДС и баланса из расчётных объектов и добавить строки контрольных равенств.
- [ ] Шаг 6: показать маркировку синтетических данных и методику признания выручки.
- [ ] Шаг 7: убрать утверждения о вероятности плана и отсутствии кассового разрыва, если они не подтверждены расчётом.
- [ ] Шаг 8: открыть приложение локально через HTTP-сервер, переключить тему, фильтры и вкладки, проверить отсутствие ошибок JavaScript.
- [ ] Шаг 9: выполнить commit с сообщением refactor: connect dashboard to financial model.

### Task 6: аудит, полный прогон и Pull Request

**Файлы:**
- Create: AUDIT.md
- Modify: docs/superpowers/specs/2026-11-03-financial-core-design.md only if implementation changes a rule

- [ ] Шаг 1: выполнить npm test. Ожидается zero failures.
- [ ] Шаг 2: выполнить git diff --check. Ожидается отсутствие whitespace errors.
- [ ] Шаг 3: проверить относительные и регистрозависимые пути ES-модулей.
- [ ] Шаг 4: выполнить поиск подозрительных остатков:

`text
rg -n "Infinity|NaN|probability|baseData|scenarioFactor|segmentFactor|unitFactor|assets -" index.html js data tests
`

Оставшиеся совпадения допустимы только в поясняющем тексте или фикстурах тестов.
- [ ] Шаг 5: заполнить AUDIT.md: изменённые файлы, найденные ошибки, исправленные правила, результаты тестов, ограничения этапа 1 и задачи этапов 2-5.
- [ ] Шаг 6: выполнить commit с сообщением docs: record financial core audit and limits.
- [ ] Шаг 7: создать Pull Request из codex/financial-core в main.
- [ ] Шаг 8: проверить PR и не объявлять этап завершённым при падении критического теста.

## Критерии готовности

- основные KPI получают данные из единого расчётного слоя;
- ОПиУ, ДДС и баланс согласованы с исходными операциями;
- контрольные равенства проходят с погрешностью округления;
- автоматические тесты проходят;
- нет искусственной корректировки капитала;
- синтетические данные явно маркированы;
- сохранены светлая и тёмная темы;
- GitHub Pages сохраняет статический режим;
- PR содержит ограничения и оставшиеся задачи этапов 2-5.
