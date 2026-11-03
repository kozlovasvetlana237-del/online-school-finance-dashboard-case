
# Управленческая аналитика этапа 2 Implementation Plan

> **Для агентной реализации:** выполнять задачи последовательно, после каждой задачи запускать проверки и фиксировать отдельный коммит.

**Цель:** добавить к финансовому ядру план-факт анализ, факторные мосты, rolling forecast на 12 месяцев и управленческие сигналы.

**Архитектура:** расширить analytics.js чистыми функциями и demo-data.js исходными драйверами, затем подключить агрегаты к существующему UI через ui.js. Все расчёты используют финансовый engine этапа 1.

**Технологический стек:** JavaScript ES2022, Node.js built-in test runner, существующий HTML/CSS, GitHub Pages.

## Глобальные ограничения

- не менять дизайн и не создавать отдельный проект;
- не использовать внешние платные сервисы;
- не использовать неподтверждённые вероятности выполнения плана;
- не смешивать факт закрытых месяцев со сценарным прогнозом;
- при нулевой базе возвращать null и отображать н/д;
- сумма факторов должна сходиться с итоговым отклонением;
- не переходить к юнит-экономике, когортам, казначейству и бюджетному контролю в рамках этого этапа.

## Карта файлов

- Modify: data/demo-data.js - добавить драйверы, версии бюджета и предыдущий прогноз.
- Modify: js/analytics.js - план-факт, факторы, forecast и сигналы.
- Modify: js/financial-engine.js - расчёт прогноза из драйверов без изменения базовой логики.
- Modify: js/ui.js - таблицы, мосты, сценарии и сигналы.
- Modify: index.html - подписи и контейнеры только при необходимости.
- Modify: tests/financial-engine.test.js - предметные тесты этапа 2.
- Create: AUDIT-STAGE-2.md - отчёт и ограничения.

### Task 1: расширить demo data драйверами

**Файлы:**
- Modify: data/demo-data.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
drivers: {
  months: Array<{
    periodId, leads, conversion, averageCheck,
    refunds, marketing, directCosts, payroll, admin
  }>,
  previousForecast: Array<{ periodId, revenue, ebitda }>,
  thresholds: {
    marketingOverrunPercent,
    ebitdaMarginMinimum,
    forecastShortfallPercent,
    refundRateMaximum
  }
}
`

- [ ] Шаг 1: добавить 12 текущих месяцев с фактом и прогнозом.
- [ ] Шаг 2: добавить плановые и фактические драйверы, previousForecast.
- [ ] Шаг 3: добавить thresholds с явными описаниями.
- [ ] Шаг 4: написать тест факта и прогноза по статусу месяца.
- [ ] Шаг 5: выполнить npm test.
- [ ] Шаг 6: commit: feat: add analytics drivers and forecast versions.

### Task 2: реализовать план-факт и факторные мосты

**Файлы:**
- Modify: js/analytics.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
calculatePlanFact({ plan, actual, kind }) -> {
  plan, actual, absolute, relative, favorable
}
calculateRevenueBridge(planDrivers, actualDrivers) -> {
  planRevenue, actualRevenue, totalVariance,
  factors: [{ key, label, impact, method }],
  method
}
calculateEbitdaBridge(planPl, actualPl) -> {
  totalVariance,
  factors: [{ key, label, impact }],
  sumOfImpacts
}
`

- [ ] Шаг 1: тест plan - fact для доходов и расходов.
- [ ] Шаг 2: реализовать favorable с учётом kind.
- [ ] Шаг 3: тест последовательных подстановок leads, conversion, averageCheck.
- [ ] Шаг 4: реализовать фиксированный порядок подстановок и метод sequential_substitution.
- [ ] Шаг 5: тест равенства суммы факторов и отклонения выручки.
- [ ] Шаг 6: реализовать EBITDA bridge для выручки, себестоимости, маркетинга, ФОТ и прочих расходов.
- [ ] Шаг 7: добавить тест отрицательного отклонения и нулевой базы.
- [ ] Шаг 8: выполнить npm test.
- [ ] Шаг 9: commit: feat: add plan fact and factor bridges.

### Task 3: реализовать rolling forecast

**Файлы:**
- Modify: js/financial-engine.js
- Modify: js/analytics.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
calculateRollingForecast(data, {
  lastClosedPeriodId,
  scenario,
  customDrivers
}) -> {
  months: Array<{
    periodId, status, revenue, ebitda,
    cashFlow, budgetRevenue, previousForecastRevenue
  }>,
  annual: { revenue, ebitda, cashFlow }
}
`

- [ ] Шаг 1: тест последовательности 12 месяцев.
- [ ] Шаг 2: тест неизменности факта до lastClosedPeriodId при смене сценария.
- [ ] Шаг 3: реализовать base, optimistic, conservative и custom.
- [ ] Шаг 4: прогнозировать новые месяцы формулой leads * conversion * averageCheck - refunds.
- [ ] Шаг 5: пересчитать EBITDA и денежный поток через существующее ядро.
- [ ] Шаг 6: добавить бюджет и previousForecast.
- [ ] Шаг 7: не рассчитывать probability и не показывать её в UI.
- [ ] Шаг 8: выполнить npm test.
- [ ] Шаг 9: commit: feat: add twelve month rolling forecast.

### Task 4: управленческие сигналы

**Файлы:**
- Modify: js/analytics.js
- Modify: js/ui.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
buildFinancialSignals({ planFact, forecast, model, thresholds }) -> Array<{
  id, title, problem, basis, cause,
  consequence, action, owner, status, severity
}>
`

- [ ] Шаг 1: тест превышения маркетингового бюджета.
- [ ] Шаг 2: тест неподтверждённой причины со статусом требует анализа.
- [ ] Шаг 3: реализовать правила маркетинга, margin, forecast shortfall, refunds и OCF.
- [ ] Шаг 4: подключить thresholds.
- [ ] Шаг 5: подключить сигналы к UI с basis, action, owner и status.
- [ ] Шаг 6: убрать старые утверждения без расчётного основания.
- [ ] Шаг 7: выполнить npm test.
- [ ] Шаг 8: commit: feat: add configurable financial signals.

### Task 5: обновить UI

**Файлы:**
- Modify: js/ui.js
- Modify: index.html
- Modify: tests/financial-engine.test.js

- [ ] Шаг 1: заменить условный waterfall план-факт таблицей и факторным мостом выручки.
- [ ] Шаг 2: добавить отдельный EBITDA bridge с суммой факторов.
- [ ] Шаг 3: добавить rolling forecast на 12 последовательных месяцев с различием факта и прогноза.
- [ ] Шаг 4: добавить выбор последнего закрытого месяца и сценария.
- [ ] Шаг 5: добавить поля драйверов для custom scenario.
- [ ] Шаг 6: убрать карточку вероятности выполнения плана.
- [ ] Шаг 7: проверить пересчёт связанных значений.
- [ ] Шаг 8: выполнить npm test и node --check.
- [ ] Шаг 9: commit: feat: connect management analytics to dashboard.

### Task 6: аудит и PR

**Файлы:**
- Create: AUDIT-STAGE-2.md

- [ ] Шаг 1: выполнить npm test, git diff --check и node --check.
- [ ] Шаг 2: проверить отсутствие probability claims в production code.
- [ ] Шаг 3: проверить сходимость revenue bridge и EBITDA bridge.
- [ ] Шаг 4: описать ограничения и не реализованные этапы.
- [ ] Шаг 5: commit: docs: add stage 2 audit.
- [ ] Шаг 6: создать PR из codex/financial-analytics в codex/financial-core.
- [ ] Шаг 7: проверить список файлов и результаты тестов.

## Критерии готовности

- план-факт рассчитан из единой модели;
- сумма факторов равна общему отклонению;
- EBITDA bridge сходится;
- rolling forecast содержит 12 последовательных месяцев;
- закрытый факт не изменяется при сценарном пересчёте;
- сигналы имеют числовое основание и статус;
- неподтверждённые причины не выдаются как факт;
- все тесты проходят;
- PR направлен в codex/financial-core.
