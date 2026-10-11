// node --test --test-isolation=none scripts/test-salary.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./test-admin-resume-exports.cjs');
const { incomeTax, breakdownOffer } = loadSource('src/lib/salary/ctc.ts', {});

test('New-regime tax: rebate, marginal relief, slabs, surcharge and cess', () => {
  assert.equal(incomeTax(0, 'new'), 0);
  assert.equal(incomeTax(1200000, 'new'), 0, 'full 87A rebate up to ₹12L');
  assert.equal(incomeTax(1210000, 'new'), 10400, 'marginal relief caps tax at income above ₹12L, plus cess');
  assert.equal(incomeTax(2000000, 'new'), 208000);
  assert.equal(incomeTax(6000000, 'new'), 1578720, '10% surcharge above ₹50L');
});

test('Old-regime tax', () => {
  assert.equal(incomeTax(500000, 'old'), 0, '87A rebate up to ₹5L');
  assert.equal(incomeTax(1000000, 'old'), 117000);
});

const base = { ctc: 1200000, variable: 0, basicPercent: 40, pfOnCappedWage: true, professionalTax: 2400, regime: 'new', oldRegimeDeductions: 0, joiningBonus: 0, noticeBuyout: 0 };

test('₹12L CTC with capped PF has no tax under the new regime', () => {
  const b = breakdownOffer(base);
  assert.equal(b.basic, 480000);
  assert.equal(b.employerPf, 21600);
  assert.equal(Math.round(b.gratuity), 23088);
  assert.equal(Math.round(b.grossSalary), 1155312);
  assert.equal(b.taxOnSalary, 0);
  assert.equal(Math.round(b.monthlyInHand), 94276);
});

test('Uncapped PF, variable pay, joining bonus and notice buyout flow through', () => {
  const capped = breakdownOffer({ ...base, ctc: 3000000 });
  const uncapped = breakdownOffer({ ...base, ctc: 3000000, pfOnCappedWage: false });
  assert.equal(uncapped.employerPf, 3000000 * 0.4 * 0.12);
  assert.ok(uncapped.monthlyInHand < capped.monthlyInHand, 'more PF means less monthly cash');

  const withExtras = breakdownOffer({ ...base, ctc: 3000000, variable: 300000, joiningBonus: 200000, noticeBuyout: 50000 });
  assert.ok(withExtras.variableAfterTax > 0 && withExtras.variableAfterTax < 300000, 'variable is taxed at the marginal rate');
  assert.equal(Math.round(withExtras.variableAfterTax), Math.round(300000 * (1 - 0.3 * 1.04)));
  assert.equal(Math.round(withExtras.joiningBonusAfterTax), Math.round(200000 * (1 - 0.3 * 1.04)));
  assert.equal(Math.round(withExtras.firstYearCash), Math.round(withExtras.annualInHand + withExtras.joiningBonusAfterTax - 50000));
});

test('Old regime uses PF, PT and declared deductions; bad inputs are clamped', () => {
  const offer = { ...base, ctc: 1500000, regime: 'old' };
  assert.ok(breakdownOffer({ ...offer, oldRegimeDeductions: 200000 }).taxOnSalary < breakdownOffer(offer).taxOnSalary);
  const clamped = breakdownOffer({ ...base, ctc: -5, variable: 99, basicPercent: 250, professionalTax: -1, joiningBonus: -1, noticeBuyout: -1 });
  for (const value of Object.values(clamped)) assert.ok(Number.isFinite(value) && value >= 0);
});
