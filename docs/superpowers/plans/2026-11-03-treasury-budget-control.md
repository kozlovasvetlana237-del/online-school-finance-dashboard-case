# Казначейство и бюджетный контроль этапа 4 Implementation Plan

> **Для агентной реализации:** выполнять задачи последовательно, после каждой задачи запускать тесты и фиксировать отдельный коммит.

**Цель:** реализовать расчётный платёжный календарь на 30, 60 и 90 дней и демонстрационный бюджетный контроль.

**Архитектура:** расширить demo-data.js операциями обязательных платежей и реестром бюджетов, добавить чистые функции в analytics.js, подключить их к ui.js и хранить редактируемые демо-статусы в localStorage.

**Технологический стек:** JavaScript ES2022, Node.js built-in test runner, HTML/CSS, GitHub Pages.

## Глобальные ограничения

- календарь строится из операций и начального остатка;
- отсутствие кассового разрыва показывается только после проверки всех дней;
- свободные средства считаются после обязательных платежей и минимального резерва;
- статусы бюджетного контроля являются локальным демо-состоянием;
- не использовать внешний сервер или платный сервис;
- сохранить текущую тему и русские подписи;
- при недостатке данных показывать н/д;
- не смешивать казначейство с ОПиУ.

## Карта файлов

- Modify: data/demo-data.js - обязательные платежи, поступления, бюджетный реестр и статусы.
- Modify: js/analytics.js - календарь ликвидности и бюджетный контроль.
- Modify: js/ui.js - таблица календаря, горизонты и localStorage.
- Modify: index.html - контейнеры и элементы управления.
- Modify: tests/financial-engine.test.js - тесты казначейства и статусов.
- Create: AUDIT-STAGE-4.md - отчёт и ограничения.

### Task 1: добавить данные казначейства и бюджетного контроля

**Файлы:**
- Modify: data/demo-data.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
treasuryPayments: Array<{
  id, date, category, amount,
  mandatory, priority, approvalStatus
}>
treasuryReceipts: Array<{
  id, date, category, amount, confirmed
}>
budgetControl: Array<{
  id, businessUnitId, owner,
  preparationStatus, approvalStatus,
  plannedDate, actualDate,
  variance, correctiveAction, actionDueDate
}>
`

- [ ] Шаг 1: добавить синтетические поступления и платежи на 90 дней.
- [ ] Шаг 2: добавить обязательные платежи с приоритетами critical, high и medium.
- [ ] Шаг 3: добавить потенциальный кассовый разрыв в одной тестовой фикстуре.
- [ ] Шаг 4: добавить несколько бизнес-юнитов, ответственных и статусов.
- [ ] Шаг 5: написать тест структуры данных.
- [ ] Шаг 6: выполнить npm test.
- [ ] Шаг 7: commit: feat: add treasury and budget control data.

### Task 2: реализовать платёжный календарь

**Файлы:**
- Modify: js/analytics.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
calculateLiquidityCalendar(data, {
  startDate,
  horizonDays,
  payments,
  minimumReserve
}) -> {
  days: Array<{
    date, openingBalance,
    receipts, payments,
    closingBalance, belowReserve
  }>,
  minimumBalance,
  cashGap,
  cashGapDates,
  mandatoryPayments,
  freeCash
}
`

- [ ] Шаг 1: написать тест ежедневного остатка.
- [ ] Шаг 2: реализовать диапазон дат через UTC без локальных сдвигов.
- [ ] Шаг 3: агрегировать поступления и платежи по каждому дню.
- [ ] Шаг 4: рассчитывать closingBalance и belowReserve.
- [ ] Шаг 5: рассчитывать minimumBalance, cashGap, cashGapDates и mandatoryPayments.
- [ ] Шаг 6: рассчитывать freeCash только после обязательных платежей и minimumReserve.
- [ ] Шаг 7: добавить тесты горизонтов 30, 60 и 90 дней.
- [ ] Шаг 8: добавить тест переноса платежа на новую дату.
- [ ] Шаг 9: выполнить npm test.
- [ ] Шаг 10: commit: feat: add liquidity calendar calculations.

### Task 3: реализовать бюджетный контроль и localStorage

**Файлы:**
- Modify: js/analytics.js
- Modify: js/ui.js
- Modify: tests/financial-engine.test.js

**Интерфейсы:**

`js
calculateBudgetControl(records, now) -> Array<{
  ...record,
  scheduleStatus, delayDays,
  isOverdue
}>
loadBudgetControlState(storage, key) -> object
saveBudgetControlState(storage, key, state) -> void
resetBudgetControlState(storage, key) -> void
`

- [ ] Шаг 1: написать тест просроченного статуса.
- [ ] Шаг 2: реализовать delayDays и isOverdue.
- [ ] Шаг 3: реализовать безопасную загрузку localStorage с fallback на исходные статусы.
- [ ] Шаг 4: реализовать сохранение и сброс статусов.
- [ ] Шаг 5: не отправлять данные во внешний сервис.
- [ ] Шаг 6: написать тест изменения статуса и сброса.
- [ ] Шаг 7: выполнить npm test.
- [ ] Шаг 8: commit: feat: add budget control state.

### Task 4: подключить UI

**Файлы:**
- Modify: index.html
- Modify: js/ui.js
- Modify: tests/financial-engine.test.js

- [ ] Шаг 1: добавить выбор горизонта 30, 60 и 90 дней.
- [ ] Шаг 2: заменить условный график остатков на таблицу ежедневного календаря.
- [ ] Шаг 3: добавить карточки начального остатка, минимума, резерва, свободных средств и кассового разрыва.
- [ ] Шаг 4: добавить кнопку или поле переноса даты платежа.
- [ ] Шаг 5: добавить вкладку бюджетного контроля.
- [ ] Шаг 6: добавить редактируемые статусы подготовки и согласования.
- [ ] Шаг 7: добавить реестр отклонений и корректирующих действий.
- [ ] Шаг 8: добавить маркировку локального демо-режима.
- [ ] Шаг 9: проверить переключение вкладок и темы.
- [ ] Шаг 10: выполнить npm test и node --check.
- [ ] Шаг 11: commit: feat: connect treasury and budget control UI.

### Task 5: аудит и PR

**Файлы:**
- Create: AUDIT-STAGE-4.md

- [ ] Шаг 1: выполнить npm test, git diff --check и node --check.
- [ ] Шаг 2: проверить отсутствие текста «кассовых разрывов нет» без расчётного основания.
- [ ] Шаг 3: проверить горизонты 30, 60 и 90 дней.
- [ ] Шаг 4: описать локальный характер статусов и ограничения.
- [ ] Шаг 5: commit: docs: add stage 4 audit.
- [ ] Шаг 6: создать PR из codex/treasury-budget-control в codex/edtech-unit-cohorts.
- [ ] Шаг 7: проверить список файлов и результаты тестов.

## Критерии готовности

- платёжный календарь строится по дням;
- кассовый разрыв определяется расчётом;
- перенос платежа меняет прогноз;
- свободные средства учитывают обязательные платежи и резерв;
- статусы бюджетного контроля сохраняются локально;
- тесты проходят;
- PR направлен в codex/edtech-unit-cohorts.
