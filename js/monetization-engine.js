/**
 * Monetization Engine ("CalcPro Monetization Engine")
 * Manages free calculation quotas, paywall triggers, subscription tiers, and promo codes.
 */
class MonetizationEngine {
  constructor() {
    this.FREE_LIMIT = 1;
    this.STORAGE_KEY = 'calcpro_monetization_state';
    this.state = this.loadState();
    this.callbacks = {
      onPaywall: [],
      onStatusChange: []
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return {
      calcCount: 0,
      isSubscribed: false,
      subscriptionTier: 'free', // 'free', 'weekly', 'annual', 'lifetime', 'trial'
      subscribedAt: null,
      activePromo: null
    };
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  isVIP() {
    return this.state.isSubscribed || this.state.subscriptionTier !== 'free';
  }

  getRemainingFreeCalcs() {
    if (this.isVIP()) return Infinity;
    return Math.max(0, this.FREE_LIMIT - this.state.calcCount);
  }

  canCalculate() {
    if (this.isVIP()) return true;
    return this.state.calcCount < this.FREE_LIMIT;
  }

  attemptCalculation() {
    if (this.canCalculate()) {
      this.state.calcCount += 1;
      this.saveState();
      this.notifyStatusChange();
      return { allowed: true, remaining: this.getRemainingFreeCalcs() };
    } else {
      // Paywall hit!
      this.triggerPaywall('quota_exceeded');
      return { allowed: false, remaining: 0 };
    }
  }

  subscribe(tier = 'annual') {
    this.state.isSubscribed = true;
    this.state.subscriptionTier = tier;
    this.state.subscribedAt = new Date().toISOString();
    this.saveState();
    this.notifyStatusChange();
  }

  applyPromoCode(rawCode) {
    const code = (rawCode || '').trim().toUpperCase();
    
    if (code === 'FREEMATH' || code === 'DEVBYPASS' || code === 'TWIST' || code === 'ANTIGRAVITY') {
      this.subscribe('lifetime');
      this.state.activePromo = code;
      this.saveState();
      this.notifyStatusChange();
      return { success: true, message: `Promo code "${code}" applied! Unlimited VIP access unlocked. 🚀` };
    }

    if (code === 'TRIAL7') {
      this.subscribe('trial');
      this.state.activePromo = code;
      this.saveState();
      this.notifyStatusChange();
      return { success: true, message: '7-Day VIP Free Trial Activated! Enjoy unlimited calculations.' };
    }

    return { success: false, message: 'Invalid promo code. Try "FREEMATH" or "DEVBYPASS".' };
  }

  restorePurchase() {
    // Simulated Apple/Google Play restore
    this.subscribe('annual');
    return { success: true, message: 'Purchases restored! Active subscription: Annual VIP Pass.' };
  }

  resetAccount() {
    this.state = {
      calcCount: 0,
      isSubscribed: false,
      subscriptionTier: 'free',
      subscribedAt: null,
      activePromo: null
    };
    this.saveState();
    this.notifyStatusChange();
  }

  triggerPaywall(reason = 'quota_exceeded') {
    this.callbacks.onPaywall.forEach(cb => cb(reason));
  }

  onPaywall(callback) {
    this.callbacks.onPaywall.push(callback);
  }

  onStatusChange(callback) {
    this.callbacks.onStatusChange.push(callback);
  }

  notifyStatusChange() {
    const status = {
      isVIP: this.isVIP(),
      tier: this.state.subscriptionTier,
      calcCount: this.state.calcCount,
      remaining: this.getRemainingFreeCalcs(),
      activePromo: this.state.activePromo
    };
    this.callbacks.onStatusChange.forEach(cb => cb(status));
  }
}

window.monetizationEngine = new MonetizationEngine();
