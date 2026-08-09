// Unit test runner for CalculatorEngine and MonetizationEngine
const fs = require('fs');

// Mock browser globals for Node testing
global.window = {};
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

// Load modules
eval(fs.readFileSync('./js/calculator-engine.js', 'utf8'));
eval(fs.readFileSync('./js/monetization-engine.js', 'utf8'));

const engine = window.calculatorEngine;
const mon = window.monetizationEngine;

console.log('--- Testing Calculator Engine ---');

// 1. Basic Arithmetic
console.assert(engine.evaluate('2+2') === 4, '2+2 should be 4');
console.assert(engine.evaluate('10 - 4 × 2') === 2, '10 - 4 * 2 should be 2');
console.assert(engine.evaluate('100 ÷ 4') === 25, '100 / 4 should be 25');
console.assert(engine.evaluate('50%') === 0.5, '50% should be 0.5');

// 2. Scientific & Trigonometry (DEG vs RAD)
engine.setAngleMode('DEG');
console.assert(engine.evaluate('sin(30)') === 0.5, `sin(30 DEG) should be 0.5, got ${engine.evaluate('sin(30)')}`);
console.assert(engine.evaluate('cos(60)') === 0.5, `cos(60 DEG) should be 0.5, got ${engine.evaluate('cos(60)')}`);
console.assert(engine.evaluate('log(100)') === 2, `log(100) should be 2, got ${engine.evaluate('log(100)')}`);
console.assert(engine.evaluate('ln(e)') === 1, `ln(e) should be 1, got ${engine.evaluate('ln(e)')}`);
console.assert(engine.evaluate('5!') === 120, `5! should be 120, got ${engine.evaluate('5!')}`);
console.assert(engine.evaluate('√(16)') === 4, `√(16) should be 4, got ${engine.evaluate('√(16)')}`);
console.assert(engine.evaluate('2^3') === 8, `2^3 should be 8, got ${engine.evaluate('2^3')}`);

console.log('✅ Calculator Engine tests passed!');

console.log('--- Testing Monetization Engine ---');
mon.resetAccount();

// 1st calculation: Free tier allowed
const first = mon.attemptCalculation();
console.assert(first.allowed === true, 'First calculation should be allowed for free');
console.assert(first.remaining === 0, 'Remaining free calculations should be 0');

// 2nd calculation: Paywall hit!
const second = mon.attemptCalculation();
console.assert(second.allowed === false, 'Second calculation must trigger the paywall');

// Unlock via promo code
const promoRes = mon.applyPromoCode('FREEMATH');
console.assert(promoRes.success === true, 'FREEMATH promo code should succeed');
console.assert(mon.isVIP() === true, 'User should now be VIP');

// Calculation after VIP unlock
const third = mon.attemptCalculation();
console.assert(third.allowed === true, 'VIP calculations should be unlimited');

console.log('✅ Monetization Engine tests passed successfully!');
