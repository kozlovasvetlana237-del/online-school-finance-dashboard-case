import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../data/demo-data.js';

test('demo data contains all required financial domains', () => {
  for (const key of ['periods', 'businessUnits', 'products', 'channels', 'sales', 'expenses', 'budgets', 'cashOperations', 'treasuryReceipts', 'treasuryPayments', 'budgetControl']) {
    assert.ok(Array.isArray(demoData[key]) && demoData[key].length > 0, key + ' must be non-empty');
  }
});

test('sales and direct costs reference known products', () => {
  const productIds = new Set(demoData.products.map((product) => product.id));
  for (const sale of demoData.sales) assert.ok(productIds.has(sale.productId), 'unknown product in sale ' + sale.id);
  for (const productId of Object.keys(demoData.directCostsByProduct)) assert.ok(productIds.has(productId), 'unknown direct-cost product ' + productId);
});

