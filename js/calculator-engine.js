/**
 * Calculator Engine
 * Handles expression parsing, trigonometry (RAD/DEG), logarithms, powers, factorials, and precision.
 */
class CalculatorEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.memoryValue = 0;
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    return this.angleMode;
  }

  // Factorial implementation
  factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // Overflow limit in JS
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  // Clean rounding helper
  cleanNumber(num) {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

    // Handle tiny floating point errors like 1.2246467991473532e-16 -> 0
    if (Math.abs(num) < 1e-15) {
      return 0;
    }

    // Fix precision to max 12 significant decimals
    const rounded = parseFloat(num.toPrecision(12));
    return rounded;
  }

  /**
   * Evaluates an arithmetic and scientific expression string.
   */
  evaluate(rawExpr) {
    if (!rawExpr || rawExpr.trim() === '') return 0;

    let expr = rawExpr;

    // Normalize symbols
    expr = expr.replace(/×/g, '*')
               .replace(/÷/g, '/')
               .replace(/−/g, '-')
               .replace(/π/g, `(${Math.PI})`)
               .replace(/\be\b/g, `(${Math.E})`);

    // Handle percentage: e.g. 50% -> (50/100)
    expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    // Handle Factorials: e.g. 5! -> factorial(5)
    expr = expr.replace(/(\d+(\.\d+)?|\([^()]+\))!/g, (match, p1) => {
      return `this.factorial(${p1})`;
    });

    // Handle powers: x^y -> Math.pow(x, y)
    // Convert a^b to Math.pow(a, b) handling parentheses
    while (expr.includes('^')) {
      const powRegex = /([a-zA-Z0-9_.]+|\([^()]+\))\^([a-zA-Z0-9_.]+|\([^()]+\))/;
      if (!powRegex.test(expr)) break;
      expr = expr.replace(powRegex, 'Math.pow($1, $2)');
    }

    // Handle square root: √(x) or √x -> Math.sqrt(x)
    expr = expr.replace(/√\s*(\([^()]+\)|\d+(\.\d+)?)/g, 'Math.sqrt($1)');
    // Handle cube root: ∛(x) or ∛x -> Math.cbrt(x)
    expr = expr.replace(/∛\s*(\([^()]+\)|\d+(\.\d+)?)/g, 'Math.cbrt($1)');

    // Handle Logs
    // log(x) -> Math.log10(x)
    // ln(x) -> Math.log(x)
    expr = expr.replace(/\blog\s*\(/g, 'Math.log10(');
    expr = expr.replace(/\bln\s*\(/g, 'Math.log(');

    // Handle Trig Functions (respecting DEG / RAD)
    const isDeg = this.angleMode === 'DEG';
    const toRad = isDeg ? `*(Math.PI/180)` : '';
    const fromRad = isDeg ? `*(180/Math.PI)` : '';

    // Inverse trig
    expr = expr.replace(/\basin\s*\(([^()]+)\)/g, `(Math.asin($1)${fromRad})`);
    expr = expr.replace(/\bacos\s*\(([^()]+)\)/g, `(Math.acos($1)${fromRad})`);
    expr = expr.replace(/\batan\s*\(([^()]+)\)/g, `(Math.atan($1)${fromRad})`);

    // Standard trig
    expr = expr.replace(/\bsin\s*\(([^()]+)\)/g, `Math.sin(($1)${toRad})`);
    expr = expr.replace(/\bcos\s*\(([^()]+)\)/g, `Math.cos(($1)${toRad})`);
    expr = expr.replace(/\btan\s*\(([^()]+)\)/g, `Math.tan(($1)${toRad})`);

    // Balance open parentheses
    let openCount = (expr.match(/\(/g) || []).length;
    let closeCount = (expr.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      expr += ')';
      closeCount++;
    }

    try {
      // Safe execution using Function constructor scoped to Math and this
      const fn = new Function('Math', 'return ' + expr);
      const res = fn.call(this, Math);

      if (typeof res !== 'number' || isNaN(res)) {
        return 'Error';
      }

      return this.cleanNumber(res);
    } catch (err) {
      console.warn('Calculation syntax error:', err, 'in expression:', expr);
      return 'Error';
    }
  }

  // Memory functions
  memoryClear() {
    this.memoryValue = 0;
    return this.memoryValue;
  }

  memoryRecall() {
    return this.memoryValue;
  }

  memoryAdd(val) {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      this.memoryValue += num;
    }
    return this.memoryValue;
  }

  memorySubtract(val) {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      this.memoryValue -= num;
    }
    return this.memoryValue;
  }
}

window.calculatorEngine = new CalculatorEngine();
