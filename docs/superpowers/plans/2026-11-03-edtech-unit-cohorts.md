# Юнит-экономика и когортный анализ этапа 3 Implementation Plan

> **Для агентной реализации:** выполнять задачи последовательно, после каждой задачи запускать тесты и фиксировать отдельный коммит.

**Цель:** добавить прозрачную юнит-экономику образовательных продуктов и когортный анализ по месяцу первого платежа.

**Архитектура:** расширить demo-data.js клиентскими и когортными атрибутами, добавить чистые функции в analytics.js, подключить расчёты к существующему financial engine и отрисовать отдельную аналитику в ui.js.

**Технологический стек:** JavaScript ES2022, Node.js built-in test runner, существующий HTML/CSS, GitHub Pages.

## Глобальные ограничения

- не использовать произвольную формулу LTV;
- CAC считать только по расходам на привлечение и новым платящим клиентам;
- active retention и repeat-purchase retention считать раздельно;
- будущие периоды без истории возвращать null и отображать н/д;
- возвраты уменьшать в выручке и валовой прибыли;
- не менять финансовые показатели вне выбранных фильтров;
- сохранить текущую тему, русские подписи и синтетическую маркировку;
- не реализовывать казначейство и бюджетный контроль на этом этапе.

## Карта файлов

- Modify: data/demo-data.js - клиенты, повторные покупки, затраты привлечения и поля когорт.
- Modify: js/analytics.js - юнит-экономика, когорты, CAC, LTV и retention.
- Modify: js/ui.js - карточки продуктов и когортная таблица.
- Modify: index.html - вкладка и контейнеры аналитики.
- Modify: tests/financial-engine.test.js - предметные тесты этапа 3.
- Create: AUDIT-STAGE-3.md - отчёт и ограничения.

### Task 1: добавить клиентские и когортные данные

**Файлы:**
- Modify: data/demo-data.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
customers: Array<{
  id, firstPaymentMonth, productId, channelId
}>
repeatPurchases: Array<{
  id, customerId, date, productId, amount, refundAmount
}>
acquisitionExpenses: Array<{
  periodId, channelId, productId, amount
}>
`

- [ ] Шаг 1: добавить синтетические customerId к продажам.
- [ ] Шаг 2: добавить firstPaymentMonth и признаки новых или повторных покупок.
- [ ] Шаг 3: добавить повторные покупки по нескольким когортам.
- [ ] Шаг 4: добавить acquisitionExpenses по каналам и продуктам.
- [ ] Шаг 5: добавить прямые затраты по продуктам и периодам.
- [ ] Шаг 6: написать тест отсутствия реальных персональных данных.
- [ ] Шаг 7: выполнить npm test.
- [ ] Шаг 8: commit: feat: add cohort and unit economics data.

### Task 2: реализовать CAC и юнит-экономику

**Файлы:**
- Modify: js/analytics.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
calculateUnitEconomics(data, filters = {}) -> Array<{
  productId, buyers, activeStudents,
  averageCheck, revenue, directCosts,
  grossProfit, contributionMargin,
  newCustomers, cac, ltvRevenue,
  ltvGrossProfit, ltvCac, paybackPeriod
}>
`

- [ ] Шаг 1: написать тест CAC = acquisitionExpenses / newCustomers.
- [ ] Шаг 2: реализовать buyers, activeStudents и averageCheck.
- [ ] Шаг 3: реализовать revenue, directCosts, grossProfit и contributionMargin.
- [ ] Шаг 4: реализовать CAC с null при нулевых новых клиентах.
- [ ] Шаг 5: реализовать LTV через накопительную когортную валовую прибыль на клиента.
- [ ] Шаг 6: реализовать LTV/CAC с null при CAC null или равном нулю.
- [ ] Шаг 7: реализовать paybackPeriod как первый наблюдаемый месяц окупаемости.
- [ ] Шаг 8: проверить возвраты и отрицательные операции.
- [ ] Шаг 9: выполнить npm test.
- [ ] Шаг 10: commit: feat: add product unit economics.

### Task 3: реализовать когортный анализ

**Файлы:**
- Modify: js/analytics.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
calculateCohortMatrix(data, metric = 'revenue') -> {
  cohorts: Array<{
    cohortMonth, newCustomers,
    repeatPurchases, activeRetention,
    repeatPurchaseRetention, averageRevenuePerCustomer,
    cumulativeRevenue, cumulativeGrossProfit,
    cumulativeCacPayback
  }>,
  metric
}
`

- [ ] Шаг 1: написать тест, что когорта определяется месяцем первого платежа.
- [ ] Шаг 2: реализовать newCustomers и repeatPurchases.
- [ ] Шаг 3: реализовать activeRetention.
- [ ] Шаг 4: реализовать repeatPurchaseRetention отдельно.
- [ ] Шаг 5: реализовать averageRevenuePerCustomer и накопительную выручку.
- [ ] Шаг 6: реализовать накопительную валовую прибыль и CAC payback.
- [ ] Шаг 7: вернуть null для будущих периодов без фактической истории.
- [ ] Шаг 8: проверить переключение metric: revenue, grossProfit, activeRetention, repeatPurchaseRetention.
- [ ] Шаг 9: выполнить npm test.
- [ ] Шаг 10: commit: feat: add cohort matrix analytics.

### Task 4: подключить UI

**Файлы:**
- Modify: index.html
- Modify: js/ui.js
- Modify: tests/financial-engine.test.js

- [ ] Шаг 1: добавить вкладку Юнит-экономика и когорты, сохранив текущую навигацию.
- [ ] Шаг 2: добавить таблицу сравнения продуктов.
- [ ] Шаг 3: добавить пояснение методики CAC и LTV.
- [ ] Шаг 4: добавить переключатель метрики когортной матрицы.
- [ ] Шаг 5: отображать н/д при отсутствии новых клиентов или истории.
- [ ] Шаг 6: подключить фильтры продукта и канала.
- [ ] Шаг 7: проверить, что возвраты меняют связанные показатели.
- [ ] Шаг 8: выполнить npm test и node --check.
- [ ] Шаг 9: commit: feat: connect unit economics and cohorts UI.

### Task 5: аудит и PR

**Файлы:**
- Create: AUDIT-STAGE-3.md

- [ ] Шаг 1: выполнить npm test, git diff --check и node --check.
- [ ] Шаг 2: проверить отсутствие формулы LTV через произвольный коэффициент.
- [ ] Шаг 3: проверить раздельность active retention и repeat retention.
- [ ] Шаг 4: описать ограничения и будущие этапы.
- [ ] Шаг 5: commit: docs: add stage 3 audit.
- [ ] Шаг 6: создать PR из codex/edtech-unit-cohorts в codex/financial-analytics.
- [ ] Шаг 7: проверить список файлов и результаты тестов.

## Критерии готовности

- CAC и LTV рассчитываются из исходных данных;
- LTV основан на когортной выручке и валовой прибыли;
- retention активных учеников и повторных покупок не смешиваются;
- будущие периоды отображаются как н/д;
- фильтры продукта и канала работают;
- тесты проходят;
- PR направлен в codex/financial-analytics.
