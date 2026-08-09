/**
 * CalcPro Application Controller
 * Orchestrates Calculator Engine, Monetization Engine, Sound FX, Confetti, and UI interactions.
 */

// Confetti Particle Engine
class ConfettiCannon {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 90) {
    if (!this.canvas || !this.ctx) return;
    const colors = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ffffff'];
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 50 + 60
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    if (!this.animating || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.rotationSpeed;
      p.life++;
      p.opacity = 1 - p.life / p.maxLife;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Main Calculator UI Controller
class CalculatorApp {
  constructor() {
    this.currentExpr = '';
    this.lastResult = null;
    this.history = [];
    this.selectedTier = 'annual';
    this.confetti = new ConfettiCannon('confetti-canvas');

    this.cacheDOM();
    this.bindEvents();
    this.initClock();
    this.renderMonetizationStatus();
  }

  cacheDOM() {
    this.phoneShell = document.getElementById('phone-shell');
    this.expressionView = document.getElementById('expression-view');
    this.resultView = document.getElementById('result-view');
    this.angleModeBtn = document.getElementById('angle-mode-btn');
    this.memoryIndicator = document.getElementById('memory-indicator');
    this.proBadge = document.getElementById('pro-badge');
    this.quotaPill = document.getElementById('quota-pill');
    this.quotaText = document.getElementById('quota-text');
    this.currentTimeEl = document.getElementById('current-time');

    // Tabs & Drawers
    this.tabBasic = document.getElementById('tab-basic');
    this.tabScientific = document.getElementById('tab-scientific');
    this.tabHistory = document.getElementById('tab-history');
    this.scientificDrawer = document.getElementById('scientific-drawer');
    this.historyOverlay = document.getElementById('history-overlay');
    this.historyList = document.getElementById('history-list');
    this.historyClearBtn = document.getElementById('history-clear-btn');
    this.historyBackBtn = document.getElementById('history-back-btn');

    // Paywall Modal
    this.paywallBackdrop = document.getElementById('paywall-backdrop');
    this.paywallCloseBtn = document.getElementById('paywall-close-btn');
    this.paywallSubscribeBtn = document.getElementById('paywall-subscribe-btn');
    this.tierCards = document.querySelectorAll('.tier-card');
    this.promoInput = document.getElementById('promo-input');
    this.promoApplyBtn = document.getElementById('promo-apply-btn');
    this.promoFeedback = document.getElementById('promo-feedback');
    this.restorePurchaseLink = document.getElementById('restore-purchase-link');

    // Checkout Modal
    this.checkoutBackdrop = document.getElementById('checkout-backdrop');
    this.checkoutCloseBtn = document.getElementById('checkout-close-btn');
    this.checkoutConfirmBtn = document.getElementById('pay-confirm-btn');
    this.checkoutTierName = document.getElementById('checkout-tier-name');
    this.checkoutTierPrice = document.getElementById('checkout-tier-price');

    // Dev Tools
    this.devResetBtn = document.getElementById('dev-reset-btn');
    this.devVipBtn = document.getElementById('dev-vip-btn');
    this.devSoundBtn = document.getElementById('dev-sound-btn');
    this.devPaywallBtn = document.getElementById('dev-paywall-btn');
  }

  bindEvents() {
    // Keypad clicks (delegated)
    document.querySelector('.keypads-wrapper').addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;

      const val = btn.dataset.val;
      const action = btn.dataset.action;

      if (val) {
        this.handleInput(val);
      } else if (action) {
        this.handleAction(action);
      }
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Nav Tabs
    this.tabBasic.addEventListener('click', () => {
      this.toggleScientific(false);
      this.closeHistory();
    });

    this.tabScientific.addEventListener('click', () => {
      this.toggleScientific(true);
      this.closeHistory();
    });

    this.tabHistory.addEventListener('click', () => {
      this.toggleHistory();
    });

    if (this.historyBackBtn) {
      this.historyBackBtn.addEventListener('click', () => {
        this.closeHistory();
        window.soundFX.playClick('action');
      });
    }

    this.historyClearBtn.addEventListener('click', () => this.clearHistory());

    // Angle Mode Toggle (DEG / RAD)
    this.angleModeBtn.addEventListener('click', () => {
      const mode = window.calculatorEngine.toggleAngleMode();
      this.angleModeBtn.textContent = mode;
      window.soundFX.playClick('action');
    });

    // Monetization Listeners
    window.monetizationEngine.onPaywall(() => this.openPaywall());
    window.monetizationEngine.onStatusChange(() => this.renderMonetizationStatus());

    this.quotaPill.addEventListener('click', () => this.openPaywall());

    // Paywall Dialog interactions
    this.paywallCloseBtn.addEventListener('click', () => this.closePaywall());
    this.paywallBackdrop.addEventListener('click', (e) => {
      if (e.target === this.paywallBackdrop) this.closePaywall();
    });

    this.tierCards.forEach(card => {
      card.addEventListener('click', () => {
        this.tierCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedTier = card.dataset.tier;
        window.soundFX.playClick('number');
      });
    });

    this.paywallSubscribeBtn.addEventListener('click', () => {
      this.openCheckout(this.selectedTier);
    });

    this.promoApplyBtn.addEventListener('click', () => this.applyPromo());
    this.promoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.applyPromo();
    });

    this.restorePurchaseLink.addEventListener('click', () => {
      const res = window.monetizationEngine.restorePurchase();
      this.showPromoFeedback(res.message, true);
      window.soundFX.playUpgradeFanfare();
      this.confetti.burst(60);
      setTimeout(() => this.closePaywall(), 1400);
    });

    // Checkout Modal interactions
    this.checkoutCloseBtn.addEventListener('click', () => this.closeCheckout());
    this.checkoutBackdrop.addEventListener('click', (e) => {
      if (e.target === this.checkoutBackdrop) this.closeCheckout();
    });

    this.checkoutConfirmBtn.addEventListener('click', () => {
      this.checkoutConfirmBtn.disabled = true;
      this.checkoutConfirmBtn.innerHTML = '<span>Processing...</span>';

      setTimeout(() => {
        window.monetizationEngine.subscribe(this.selectedTier);
        window.soundFX.playUpgradeFanfare();
        this.confetti.burst(120);

        this.checkoutConfirmBtn.disabled = false;
        this.checkoutConfirmBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Subscribed!</span>';

        setTimeout(() => {
          this.closeCheckout();
          this.closePaywall();
        }, 1200);
      }, 700);
    });

    // Developer Sandbox Controls
    this.devResetBtn.addEventListener('click', () => {
      window.monetizationEngine.resetAccount();
      this.renderMonetizationStatus();
      this.resultView.textContent = '0';
      this.expressionView.textContent = '';
      this.currentExpr = '';
      window.soundFX.playClick('action');
    });

    this.devVipBtn.addEventListener('click', () => {
      if (window.monetizationEngine.isVIP()) {
        window.monetizationEngine.resetAccount();
      } else {
        window.monetizationEngine.subscribe('annual');
        window.soundFX.playUpgradeFanfare();
        this.confetti.burst(80);
      }
    });

    this.devSoundBtn.addEventListener('click', () => {
      const isMuted = window.soundFX.toggleMute();
      this.devSoundBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
      this.devSoundBtn.classList.toggle('active', isMuted);
    });

    this.devPaywallBtn.addEventListener('click', () => this.openPaywall());
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes;
      hours = hours < 10 ? '0' + hours : hours;
      if (this.currentTimeEl) {
        this.currentTimeEl.textContent = `${hours}:${minutes}`;
      }
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  handleInput(val) {
    window.soundFX.playClick(this.isOperator(val) ? 'operator' : 'number');

    // If starting fresh after a calculation result
    if (this.lastResult !== null && !this.isOperator(val)) {
      this.currentExpr = '';
      this.lastResult = null;
    } else if (this.lastResult !== null && this.isOperator(val)) {
      this.currentExpr = String(this.lastResult);
      this.lastResult = null;
    }

    this.currentExpr += val;
    this.updateDisplay();
  }

  handleAction(action) {
    switch (action) {
      case 'clear':
        window.soundFX.playClick('action');
        this.currentExpr = '';
        this.lastResult = null;
        this.resultView.textContent = '0';
        this.resultView.classList.remove('error');
        this.expressionView.textContent = '';
        break;

      case 'backspace':
        window.soundFX.playClick('action');
        this.currentExpr = this.currentExpr.slice(0, -1);
        this.updateDisplay();
        break;

      case 'negate':
        window.soundFX.playClick('operator');
        if (this.currentExpr) {
          if (this.currentExpr.startsWith('-')) {
            this.currentExpr = this.currentExpr.substring(1);
          } else {
            this.currentExpr = '-' + this.currentExpr;
          }
          this.updateDisplay();
        }
        break;

      case 'sin':
      case 'cos':
      case 'tan':
      case 'asin':
      case 'acos':
      case 'atan':
      case 'log':
      case 'ln':
        window.soundFX.playClick('function');
        this.currentExpr += `${action}(`;
        this.updateDisplay();
        break;

      case 'sqrt':
        window.soundFX.playClick('function');
        this.currentExpr += '√(';
        this.updateDisplay();
        break;

      case 'cbrt':
        window.soundFX.playClick('function');
        this.currentExpr += '∛(';
        this.updateDisplay();
        break;

      case 'sqr':
        window.soundFX.playClick('function');
        this.currentExpr += '^2';
        this.updateDisplay();
        break;

      case 'pow':
        window.soundFX.playClick('function');
        this.currentExpr += '^';
        this.updateDisplay();
        break;

      case 'pi':
        window.soundFX.playClick('number');
        this.currentExpr += 'π';
        this.updateDisplay();
        break;

      case 'e':
        window.soundFX.playClick('number');
        this.currentExpr += 'e';
        this.updateDisplay();
        break;

      case 'fact':
        window.soundFX.playClick('function');
        this.currentExpr += '!';
        this.updateDisplay();
        break;

      case 'mc':
        window.calculatorEngine.memoryClear();
        this.memoryIndicator.classList.remove('active');
        window.soundFX.playClick('action');
        break;

      case 'mr':
        const mem = window.calculatorEngine.memoryRecall();
        this.currentExpr += mem;
        this.updateDisplay();
        window.soundFX.playClick('action');
        break;

      case 'mplus':
        if (this.resultView.textContent && this.resultView.textContent !== 'Error') {
          window.calculatorEngine.memoryAdd(this.resultView.textContent);
          this.memoryIndicator.classList.add('active');
          window.soundFX.playClick('action');
        }
        break;

      case 'equals':
        this.executeEquals();
        break;
    }
  }

  executeEquals() {
    if (!this.currentExpr || this.currentExpr.trim() === '') return;

    // BUSINESS LOGIC TWIST: Check monetization quota!
    const attempt = window.monetizationEngine.attemptCalculation();

    if (!attempt.allowed) {
      // Paywall hit!
      window.soundFX.playPaywallAlert();
      this.shakeDisplay();
      return;
    }

    // Calculation allowed (Free tier calculation or VIP subscriber)
    window.soundFX.playClick('equals');
    const result = window.calculatorEngine.evaluate(this.currentExpr);

    this.expressionView.textContent = this.currentExpr + ' =';
    this.resultView.textContent = result;
    this.resultView.classList.toggle('error', result === 'Error');

    // Add to history tape
    if (result !== 'Error') {
      this.addHistory(this.currentExpr, result);
      this.lastResult = result;
    }
  }

  updateDisplay() {
    if (!this.currentExpr) {
      this.expressionView.textContent = '';
      this.resultView.textContent = '0';
      this.resultView.classList.remove('error');
      return;
    }

    this.expressionView.textContent = this.currentExpr;

    // Dynamically adjust font size for long expressions
    if (this.currentExpr.length > 12) {
      this.resultView.style.fontSize = '1.8rem';
    } else {
      this.resultView.style.fontSize = '2.5rem';
    }
  }

  shakeDisplay() {
    this.phoneShell.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 350,
      easing: 'ease-in-out'
    });
  }

  isOperator(char) {
    return ['+', '−', '×', '÷', '^', '%'].includes(char);
  }

  handleKeyboard(e) {
    if (this.paywallBackdrop.classList.contains('open') || this.checkoutBackdrop.classList.contains('open')) {
      if (e.key === 'Escape') {
        this.closePaywall();
        this.closeCheckout();
      }
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      this.handleInput(e.key);
    } else if (e.key === '.') {
      this.handleInput('.');
    } else if (e.key === '+') {
      this.handleInput('+');
    } else if (e.key === '-') {
      this.handleInput('−');
    } else if (e.key === '*') {
      this.handleInput('×');
    } else if (e.key === '/') {
      e.preventDefault();
      this.handleInput('÷');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      this.handleAction('equals');
    } else if (e.key === 'Backspace') {
      this.handleAction('backspace');
    } else if (e.key === 'Escape') {
      this.handleAction('clear');
    } else if (e.key === '(' || e.key === ')') {
      this.handleInput(e.key);
    }
  }

  toggleScientific(show) {
    this.scientificDrawer.classList.toggle('collapsed', !show);
    this.tabScientific.classList.toggle('active', show);
    this.tabBasic.classList.toggle('active', !show);
  }

  toggleHistory() {
    const isOpen = this.historyOverlay.classList.contains('open');
    if (isOpen) {
      this.closeHistory();
    } else {
      this.historyOverlay.classList.add('open');
      this.tabHistory.classList.add('active');
    }
  }

  closeHistory() {
    this.historyOverlay.classList.remove('open');
    this.tabHistory.classList.remove('active');
  }

  addHistory(expr, result) {
    this.history.unshift({ expr, result, time: new Date().toLocaleTimeString() });
    if (this.history.length > 30) this.history.pop();
    this.renderHistory();
  }

  clearHistory() {
    this.history = [];
    this.renderHistory();
    window.soundFX.playClick('action');
  }

  renderHistory() {
    if (this.history.length === 0) {
      this.historyList.innerHTML = `
        <div class="history-empty">
          <p>No calculations recorded yet</p>
          <button class="btn-return-calc" id="history-return-btn">← Return to Calculator</button>
        </div>
      `;
      const returnBtn = document.getElementById('history-return-btn');
      if (returnBtn) {
        returnBtn.addEventListener('click', () => {
          this.closeHistory();
          window.soundFX.playClick('action');
        });
      }
      return;
    }

    this.historyList.innerHTML = this.history.map((item, idx) => `
      <div class="history-item" data-idx="${idx}">
        <div class="hist-expr">${item.expr} =</div>
        <div class="hist-res">${item.result}</div>
      </div>
    `).join('');

    // Clicking a history item puts its result into the calculator
    this.historyList.querySelectorAll('.history-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const idx = itemEl.dataset.idx;
        const item = this.history[idx];
        if (item) {
          this.currentExpr = String(item.result);
          this.updateDisplay();
          this.closeHistory();
          window.soundFX.playClick('number');
        }
      });
    });
  }

  // Paywall & Monetization Methods
  openPaywall() {
    this.promoFeedback.textContent = '';
    this.paywallBackdrop.classList.add('open');
  }

  closePaywall() {
    this.paywallBackdrop.classList.remove('open');
  }

  openCheckout(tier) {
    const tierMap = {
      weekly: { name: 'Weekly Pass', price: '$2.99' },
      annual: { name: 'Annual VIP Pass (Best Value)', price: '$29.99' },
      lifetime: { name: 'Lifetime Math God Pass', price: '$59.99' }
    };

    const details = tierMap[tier] || tierMap.annual;
    this.checkoutTierName.textContent = details.name;
    this.checkoutTierPrice.textContent = details.price;
    this.checkoutBackdrop.classList.add('open');
  }

  closeCheckout() {
    this.checkoutBackdrop.classList.remove('open');
  }

  applyPromo() {
    const code = this.promoInput.value;
    const res = window.monetizationEngine.applyPromoCode(code);
    this.showPromoFeedback(res.message, res.success);

    if (res.success) {
      window.soundFX.playUpgradeFanfare();
      this.confetti.burst(100);
      setTimeout(() => {
        this.closePaywall();
      }, 1500);
    } else {
      window.soundFX.playPaywallAlert();
    }
  }

  showPromoFeedback(msg, isSuccess) {
    this.promoFeedback.textContent = msg;
    this.promoFeedback.className = 'promo-feedback ' + (isSuccess ? 'success' : 'error');
  }

  renderMonetizationStatus() {
    const isVIP = window.monetizationEngine.isVIP();
    const remaining = window.monetizationEngine.getRemainingFreeCalcs();

    if (isVIP) {
      this.phoneShell.classList.add('vip-active');
      this.proBadge.textContent = '👑 VIP';
      this.quotaPill.className = 'quota-pill vip';
      this.quotaText.textContent = 'Unlimited Math VIP';
      this.devVipBtn.classList.add('active');
    } else {
      this.phoneShell.classList.remove('vip-active');
      this.proBadge.textContent = 'FREE';
      this.devVipBtn.classList.remove('active');

      if (remaining > 0) {
        this.quotaPill.className = 'quota-pill';
        this.quotaText.textContent = `${remaining} Free Calc Left`;
      } else {
        this.quotaPill.className = 'quota-pill exhausted';
        this.quotaText.textContent = 'Quota Used • Upgrade';
      }
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CalculatorApp();
});
