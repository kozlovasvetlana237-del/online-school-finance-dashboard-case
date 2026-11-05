import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');

test('index exposes the required global controls', () => {
  for (const id of ['period', 'scenario', 'comparisonPeriod', 'viewMode', 'segment', 'product', 'unit', 'themeToggle', 'cohortMetric', 'treasuryHorizon', 'treasuryPaymentDate', 'saveCustomScenario', 'resetCustomScenario']) {
    assert.ok(html.includes('id="' + id + '"') || html.includes("id='" + id + "'"), 'missing control ' + id);
  }
});

test('index exposes every required dashboard tab and module entrypoint', () => {
  for (const tab of ['overview', 'budget', 'forecast', 'statements', 'drivers', 'unit-cohorts', 'treasury', 'budget-control', 'quality']) {
    assert.ok(html.includes('data-tab="' + tab + '"') || html.includes("data-tab='" + tab + "'"), 'missing tab ' + tab);
  }
  assert.match(ui, /Демонстрационная финансовая модель/);
  assert.match(html, /<script\s+type=["']module["']\s+src=["']\.\/js\/ui\.js\?v=[^"']+["']/);
  assert.match(ui, /from ['"]\.\/ui-state\.js\?v=[^'"]+['"]/);
});

