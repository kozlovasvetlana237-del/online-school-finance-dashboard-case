# Final Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** закрыть частичные требования ТЗ по фильтрам, пользовательскому сценарию, KPI и казначейству.

**Architecture:** расширить чистое состояние UI и использовать существующие расчётные функции. Локальные настройки сценария и даты платежа применять к копиям данных, не мутируя `demoData`.

**Tech Stack:** vanilla HTML/CSS/ES modules, Node.js built-in test runner, localStorage, GitHub Pages.

## Global Constraints

- синтетические данные не выдаются за реальные;
- внешние зависимости не добавляются;
- исходная модель данных не мутируется;
- нулевая база сравнения выводится как `н/д`;
- `npm test` должен проходить полностью.

---

### Task 1: расширить состояние фильтров и локальных настроек

**Files:**
- Modify: `js/ui-state.js`
- Test: `tests/ui-state.test.js`

- [ ] **Step 1: add tests** for product, comparison period, view mode, custom driver normalization and payment-date override.
- [ ] **Step 2: implement pure helpers** `readFilterState`, `readCustomDrivers`, `loadLocalState`, `saveLocalState` and `applyPaymentDateOverride`.
- [ ] **Step 3: run** `npm test` and confirm the focused tests pass.
- [ ] **Step 4: commit** `feat: support final acceptance state`.

### Task 2: connect filters and custom scenario

**Files:**
- Modify: `index.html`
- Modify: `js/ui.js`
- Test: `tests/interface-contract.test.js`

- [ ] **Step 1: add** comparison, product and view-mode controls, plus custom-scenario save/reset controls.
- [ ] **Step 2: read** the controls in `selectedFilters()` and pass product and business-unit filters to the model and unit economics.
- [ ] **Step 3: initialize** financial-model controls from demo drivers, synchronize number/range inputs, save custom values, and pass them to `calculateRollingForecast`.
- [ ] **Step 4: render** plan/fact/forecast labels consistently and add contract assertions.
- [ ] **Step 5: run** `npm test`.
- [ ] **Step 6: commit** `feat: activate final dashboard controls`.

### Task 3: add KPI and editable treasury payment date

**Files:**
- Modify: `js/ui.js`
- Modify: `index.html`
- Test: `tests/financial-engine.test.js`

- [ ] **Step 1: add** tests proving payment-date override changes liquidity and zero denominator returns `н/д` through the UI formatter contract.
- [ ] **Step 2: render** CAC, LTV/CAC and refund rate from demo data.
- [ ] **Step 3: render** a date input for the first conditional treasury payment and recalculate the calendar from the overridden copy.
- [ ] **Step 4: run** full tests and browser smoke-test.
- [ ] **Step 5: commit** `feat: complete final acceptance controls`.

### Task 4: publish and verify

**Files:**
- Create: `AUDIT-FINAL-ACCEPTANCE.md`

- [ ] **Step 1: record** test count and browser checks.
- [ ] **Step 2: create** PR `codex/final-acceptance` -> `main`.
- [ ] **Step 3: merge** only after tests pass.
- [ ] **Step 4: verify** GitHub Pages and report remaining limitations.

