import { API_URL } from '../config/api';

/**
 * ============================================================
 * TradeLineManager v7.19 — Phase 66: THE NATIVE ENGINE (CLEAN SLATE)
 * ============================================================
 * v7.19 Absolute Native:
 * - 100% TradingView Native Order Lines (createOrderLine)
 * - MT5 Lag-Free Dragging (Library Engine)
 * - Zero Custom Canvas/Overlay hacks
 * ============================================================
 */
// ─── Auth ────────────────────────────────────────────────────
window.TRADE_ENGINE_VERSION = '7.19-NATIVE';
console.log('%c [TradeManager v7.19] NATIVE ENGINE ACTIVE ', 'background: #222; color: #00bcd4; font-size: 20px;');

const normalizeToken = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  if (!t || t === 'undefined' || t === 'null') return '';
  return t.startsWith('Bearer ') ? t.slice(7).trim() : t;
};

const getAuthToken = () => {
  const direct = normalizeToken(localStorage.getItem('token'));
  if (direct) return direct;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return normalizeToken(user?.token || user?.accessToken || user?.jwt);
  } catch { return ''; }
};

// ─── Symbol normalization ─────────────────────────────────────
const canonicalSymbol = (raw) => {
  const v = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!v) return '';
  if (/^[A-Z]{6}/.test(v)) return v.slice(0, 6);
  return v;
};

// ─── Price formatting ─────────────────────────────────────────
const fmt = (price) => {
  if (!Number.isFinite(price)) return '0.00';
  return price > 100 ? price.toFixed(2) : price.toFixed(5);
};

// ─── Debounce ─────────────────────────────────────────────────
const debounce = (fn, ms) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

// ─────────────────────────────────────────────────────────────
export class TradeLineManager {
  constructor(chartRef, onTradeModify) {
    this.chartRef = chartRef;
    this.onTradeModify = onTradeModify;
    this.lines = {}; // tradeId -> { entryLine, slLine, tpLine }
    this.trades = [];
    this.lastSync = 0;
    console.log('[TradeManager v7.19] Native Engine Initialized');
  }

  initialize(widget) {
    this.widget = widget;
  }

  destroy() {
    Object.values(this.lines).forEach(set => {
      set.entry?.remove(); set.sl?.remove(); set.tp?.remove();
    });
    this.lines = {};
  }

  async syncTrades(trades, symbol = null) {
    this.trades = trades || [];
    const now = Date.now();
    if (now - this.lastSync < 500) return;
    this.lastSync = now;

    if (!this.widget) return;
    const chart = this.widget.chart();
    
    // 1. Identify trades for current symbol
    const curSymbol = canonicalSymbol(symbol);
    const visible = trades.filter(t => canonicalSymbol(t.symbol) === curSymbol);
    const visibleIds = new Set(visible.map(t => String(t._id || t.id)));

    // 2. Remove non-existent
    Object.keys(this.lines).forEach(tid => {
      if (!visibleIds.has(tid)) {
        this.lines[tid].entry?.remove();
        this.lines[tid].sl?.remove();
        this.lines[tid].tp?.remove();
        delete this.lines[tid];
      }
    });

    // 3. Sync each trade
    for (const trade of visible) {
      this._syncNativeTrade(chart, trade);
    }
  }

  _syncNativeTrade(chart, trade) {
    const tid = String(trade._id || trade.id);
    const price = Number(trade.openPrice || trade.price);
    const sl = Number(trade.stopLoss || trade.sl);
    const tp = Number(trade.takeProfit || trade.tp);
    const side = String(trade.side || trade.type || '').toLowerCase();
    const isBuy = side.includes('buy') || side.includes('long');

    if (!this.lines[tid]) this.lines[tid] = { entry: null, sl: null, tp: null };
    const set = this.lines[tid];

    // ENTRY LINE
    if (!set.entry) {
      set.entry = chart.createOrderLine()
        .setPrice(price)
        .setText(`ENTRY ${side.toUpperCase()} ${trade.lots || trade.amount || ''}`)
        .setLineColor('#2196F3')
        .setLineWidth(2)
        .setExtendLeft(true)
        .setCancelTooltip('Close Trade')
        .onMove(() => this._onNativeMove(tid, 'entry', set.entry.getPrice()))
        .onModify(() => this._commitTrade(tid, 'entry', set.entry.getPrice()))
        .onCancel(() => console.log('Cancel trade triggered'));
    } else {
      set.entry.setPrice(price);
    }

    // SL LINE
    if (sl > 0) {
      if (!set.sl) {
        set.sl = chart.createOrderLine()
          .setPrice(sl)
          .setText(`SL  ${fmt(sl)}`)
          .setLineColor('#f44336')
          .setLineStyle(1)
          .setExtendLeft(true)
          .onModify(() => this._commitTrade(tid, 'sl', set.sl.getPrice()));
      } else {
        set.sl.setPrice(sl).setText(`SL  ${fmt(sl)}`);
      }
    } else if (set.sl) { set.sl.remove(); set.sl = null; }

    // TP LINE
    if (tp > 0) {
      if (!set.tp) {
        set.tp = chart.createOrderLine()
          .setPrice(tp)
          .setText(`TP  ${fmt(tp)}`)
          .setLineColor('#4caf50')
          .setLineStyle(1)
          .setExtendLeft(true)
          .onModify(() => this._commitTrade(tid, 'tp', set.tp.getPrice()));
      } else {
        set.tp.setPrice(tp).setText(`TP  ${fmt(tp)}`);
      }
    } else if (set.tp) { set.tp.remove(); set.tp = null; }
  }

  _onNativeMove(tid, type, newPrice) {
    // 🛡️ MT5 Logic: Could be used for proportional SL/TP movement if desired
    // console.log(`[TradeManager] Native Move: ${tid} ${type} -> ${newPrice}`);
  }

  async _commitTrade(tid, type, price) {
    console.log(`[TradeManager] Native Commit: ${tid} ${type} -> ${price}`);
    const payload = { tradeId: tid };
    if (type === 'sl') payload.sl = price;
    else if (type === 'tp') payload.tp = price;
    else return; // Don't allow entry change via drag for existing trades

    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/trade/modify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && this.onTradeModify) {
        this.onTradeModify({ tradeId: tid, [type]: price });
      }
    } catch (e) {
      console.error('[TradeManager] Commit error:', e);
    }
  }
}
