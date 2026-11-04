# Interface Quality and Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** закрыть этап 5 ТЗ проверяемыми UI-контрактами, тестами данных и браузерной проверкой опубликованной страницы.

**Architecture:** чистые функции состояния интерфейса будут отделены в `js/ui-state.js`; `js/ui.js` будет использовать их без изменения финансовых расчётов. Node-тесты будут проверять HTML-контракт и целостность демо-данных, а браузерный smoke-тест подтвердит работу реального GitHub Pages.

**Tech Stack:** vanilla HTML/CSS/ES modules, Node.js built-in test runner, GitHub Pages.

## Global Constraints

- синтетические данные не выдаются за реальные;
- внешние зависимости и платные сервисы не добавляются;
- финансовые формулы не меняются без воспроизводимой ошибки;
- русский интерфейс, светлая и тёмная темы и GitHub Pages сохраняются;
- после изменений `npm test` должен проходить полностью.

---

### Task 1: выделить тестируемое состояние интерфейса

**Files:**
- Create: `js/ui-state.js`
- Modify: `js/ui.js`
- Test: `tests/ui-state.test.js`

**Interfaces:**
- Produces `readFilterState(elements, data)` с полями `period`, `periodIds`, `businessUnitId`, `scenario`, `unit`.
- Produces `nextTheme(theme)`, возвращающую только `light` или `dark`.

- [ ] **Step 1: write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTheme, readFilterState } from '../js/ui-state.js';

test('nextTheme alternates only supported themes', () => {
  assert.equal(nextTheme('dark'), 'light');
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('unexpected'), 'dark');
});

test('readFilterState maps selected period and segment', () => {
  const state = readFilterState({
    period: { value: '2026 YTD' },
    scenario: { value: 'Оптимистичный сценарий' },
    segment: { value: 'Премиум-программы' },
    unit: { value: 'Продажи' }
  }, { periods: [{ id: '2026-01' }, { id: '2025-12' }] });
  assert.deepEqual(state.periodIds, ['2026-01']);
  assert.equal(state.businessUnitId, 'premium');
  assert.equal(state.scenario, 'optimistic');
  assert.equal(state.unit, 'Продажи');
});

test('readFilterState falls back safely for unknown values', () => {
  const state = readFilterState({}, { periods: [{ id: '2026-01' }] });
  assert.equal(state.period, 'Сентябрь 2026');
  assert.deepEqual(state.periodIds, []);
  assert.equal(state.businessUnitId, undefined);
  assert.equal(state.scenario, 'base');
});
```

- [ ] **Step 2: run the focused test and verify it fails**

Run: `node --test tests/ui-state.test.js`

Expected: FAIL because `js/ui-state.js` does not exist.

- [ ] **Step 3: implement the minimal pure module**

```js
const periods = {
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
  const periodIds = periods[period] || (period === '2026 YTD'
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
```

- [ ] **Step 4: connect `ui.js` to the pure module**

Replace the local `periodMap` and `selectedFilters` logic with imports from `ui-state.js`; replace the theme ternary with `nextTheme(document.body.dataset.theme)` and pass the actual filter elements to `readFilterState`.

- [ ] **Step 5: run tests**

Run: `node --test tests/ui-state.test.js`

Expected: 3 passing tests.

- [ ] **Step 6: commit**

```bash
git add js/ui-state.js js/ui.js tests/ui-state.test.js
git commit -m "test: isolate dashboard filter state"
```

### Task 2: add HTML and demo-data contract tests

**Files:**
- Create: `tests/interface-contract.test.js`
- Create: `tests/demo-data-integrity.test.js`

**Interfaces:**
- Tests read repository files using `node:fs` and do not need a browser or network.

- [ ] **Step 1: write contract tests**

Assert that `index.html` contains `id="period"`, `id="scenario"`, `id="segment"`, `id="unit"`, `id="themeToggle"`, the nine required `data-tab` values, the demo disclaimer, and `type="module" src="./js/ui.js"`. Assert that `js/ui.js` imports `ui-state.js`.

- [ ] **Step 2: write data-integrity tests**

Import `demoData` and assert that periods, products, business units, budgets, sales, cash operations, treasury receipts and payments are non-empty, every sale references a known product, and every direct-cost product key references a known product.

- [ ] **Step 3: run the full suite**

Run: `npm test`

Expected: all previous tests plus the new contract and data tests pass.

- [ ] **Step 4: commit**

```bash
git add tests/interface-contract.test.js tests/demo-data-integrity.test.js
git commit -m "test: add interface and demo data contracts"
```

### Task 3: browser smoke-test and release evidence

**Files:**
- Create: `AUDIT-STAGE-5.md`

- [ ] **Step 1: run the full local test suite**

Run: `npm test`

Record the exact test count and result in `AUDIT-STAGE-5.md`.

- [ ] **Step 2: inspect the published page in a browser**

Open `https://kozlovasvetlana237-del.github.io/online-school-finance-dashboard-case/` and verify: initial KPI values are visible, every main tab switches, the period and scenario selects update the page without errors, the theme toggles, the cohort metric changes, treasury horizon 90 days changes the horizon text, and budget-control status selects remain editable.

- [ ] **Step 3: record limitations honestly**

Document that status edits use `localStorage`, demo data are synthetic, and no server-side workflow is present.

- [ ] **Step 4: commit evidence**

```bash
git add AUDIT-STAGE-5.md
git commit -m "docs: record stage 5 verification"
```

### Task 4: publish and open the pull request

**Files:**
- No source files; Git branch and pull request only.

- [ ] **Step 1: run the final suite**

Run: `npm test`

Expected: zero failures.

- [ ] **Step 2: push the branch**

```bash
git push -u origin codex/interface-quality
```

- [ ] **Step 3: open the PR**

Target: `main`.

- [ ] **Step 4: report the PR URL and test result**

Do not claim completion if the published page or test suite fails.

