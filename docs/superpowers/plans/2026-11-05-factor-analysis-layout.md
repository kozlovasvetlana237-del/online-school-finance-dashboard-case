# Factor Analysis Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** make the factor-analysis bridges readable in the budget plan-fact tab at desktop and mobile widths without changing financial calculations.

**Architecture:** keep the existing `varianceWaterfall` render output and financial-engine data unchanged. Change only the CSS grid contract for that container so each `.signal` gets a readable half-width column on desktop and a full-width row on narrow screens. Add an interface contract test that protects the layout rule and the existing bridge render target.

**Tech Stack:** static HTML/CSS, ES modules, Node.js built-in test runner.

## Global Constraints

- Do not change financial formulas or source data.
- Preserve the existing Russian labels and bridge calculations.
- Keep the current dark/light theme tokens and responsive breakpoints.
- Run `npm test` and `git diff --check` before committing.

---

### Task 1: lock the layout contract with a failing test

**Files:**
- Modify: `tests/interface-contract.test.js`

**Interfaces:**
- Consumes: the existing `index.html` CSS and `js/ui.js` bridge target.
- Produces: a test requiring a two-column desktop layout for `#varianceWaterfall` and the existing `varianceWaterfall` render target.

- [ ] **Step 1: add the failing contract assertions**

Add after the existing `revenueChart` assertion:

```js
  assert.match(html, /\.waterfall\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)/);
  assert.match(ui, /getElementById\(['"]varianceWaterfall['"]\)/);
```

- [ ] **Step 2: run the focused test**

Run: `node --test tests/interface-contract.test.js`

Expected: FAIL because the current `.waterfall` rule uses six columns.

### Task 2: implement the readable bridge layout

**Files:**
- Modify: `index.html:80-95, 250-280`

**Interfaces:**
- Consumes: the two `.signal` elements rendered into `#varianceWaterfall` by `renderDashboard`.
- Produces: a two-column desktop layout and a one-column layout at the existing 820px breakpoint.

- [ ] **Step 1: change the desktop waterfall grid**

Replace the current rule:

```css
.waterfall{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;align-items:end;height:280px;padding-top:10px}
```

with:

```css
.waterfall{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch;min-height:280px;padding-top:10px}
```

- [ ] **Step 2: add the mobile override**

Inside the existing `@media(max-width:820px)` block add:

```css
  .waterfall{grid-template-columns:1fr;min-height:0}
```

- [ ] **Step 3: run the focused test**

Run: `node --test tests/interface-contract.test.js`

Expected: PASS.

### Task 3: run the full verification and commit

**Files:**
- Test: `tests/*.test.js`

- [ ] **Step 1: run all tests**

Run: `npm test`

Expected: all tests pass, with no failures.

- [ ] **Step 2: validate whitespace**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 3: commit the implementation**

```bash
git add index.html tests/interface-contract.test.js docs/superpowers/plans/2026-11-05-factor-analysis-layout.md
git commit -m "fix: make factor analysis bridges readable"
```

