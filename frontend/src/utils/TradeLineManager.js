import { API_URL } from '../config/api';

/**
 * ============================================================
 * TradeLineManager v7.28 — Phase 66: THE PERFECTIONIST
 * ============================================================
 * v7.28 Perfectionist:
 * - Sync Lock (2.5s guard after commit to prevent flicker)
 * - Dynamic Precision (Instrument-aware decimal places)
 * - Absolute Entry Pinning (Snap-back refinement)
 * - State-Preserving Commits (Merge SL/TP)
 * ============================================================
 */
// ─── Auth ────────────────────────────────────────────────────
window.TRADE_ENGINE_VERSION = '7.28-PERFECT';
console.log('%c [TradeManager v7.28] PERFECTIONIST ENGINE ACTIVE ', 'background: #222; color: #e91e63; font-size: 20px;');

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
    this.lines = {}; // tradeId -> { entry, sl, tp, ghost }
    this.tvIdMap = {}; // tvId -> { tradeId, type }
    this.trades = [];
    this.lastSync = 0;
    this.isCommitBlocked = false;
    
    // Ghost tracking
    this.activeDragId = null;
    this.dragStartPrice = 0;
    this.isUpdatingGhost = false;
    this._missingTrades = {}; // tid -> timestamp
    this.syncLockUntil = 0; // v7.28 Anti-Flicker lock

    console.log('[TradeManager v7.28] Perfectionist Engine Initialized');
  }

  initialize(widget) {
    this.widget = widget;
    this._attachEvents(widget);
  }

  destroy() {
    if (this.widget && this._handler) {
      this.widget.unsubscribe('drawing_event', this._handler);
    }
    Object.keys(this.lines).forEach(tid => this.removeTradeLines(tid));
  }

  // ─── Events ──────────────────────────────────────────────────

  _attachEvents(widget) {
    this.commitTimers = {};

    this._handler = (id, status) => {
      const tvId = String(id);
      const meta = this.tvIdMap[tvId];
      if (!meta || this.isCommitBlocked) return;

      const action = String(status?.status || status || '').toLowerCase();
      
      // Stop logging spammy points_changed events
      if (action !== 'points_changed') {
          console.log(`[TradeManager] EVENT: ${tvId} (${meta.type}) status="${action}"`);
      }

      if (action === 'started') {
        this.activeDragId = meta.tradeId;
        const shape = widget.chart().getShapeById(tvId);
        this.dragStartPrice = shape?.getPoints?.()?.[0]?.price || 0;
      }

      // 🛡️ v7.30 Debounced Real-Time Drag Parsing
      // Never use properties_changed, it triggers infinite snap-back loops when labels update
      if (action === 'points_changed') {
          if (meta.type === 'entry') this._onNativeMove(tvId, meta); // spawn ghost

          if (this.commitTimers[tvId]) clearTimeout(this.commitTimers[tvId]);
          this.commitTimers[tvId] = setTimeout(() => {
              this._onNativeStop(tvId, meta);
          }, 750);
      }
    };
    widget.subscribe('drawing_event', this._handler);
  }

  async _onNativeMove(tvId, meta) {
    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    const price = shape?.getPoints?.()?.[0]?.price;
    if (!price || this.isUpdatingGhost) return;

    // ─── MT5 Ghosting (Spawn Logic) ─────────────────────────────
    if (meta.type === 'entry') {
        const trade = this.getTradeById(meta.tradeId);
        if (!trade) return;

        const side = String(trade.side || trade.type || '').toLowerCase();
        const isBuy = side.includes('buy') || side.includes('long');
        const entry = Number(trade.openPrice || trade.price);
        
        let ghostType = isBuy ? (price > entry ? 'tp' : 'sl') : (price > entry ? 'sl' : 'tp');

        // Serialized ghost update
        this.isUpdatingGhost = true;
        try {
            await this._updateSpawnGhost(meta.tradeId, ghostType, price);
        } finally {
            this.isUpdatingGhost = false;
        }
    }
  }

  async _updateSpawnGhost(tradeId, type, price) {
    const tid = String(tradeId);
    if (!this.lines[tid]) return;
    const set = this.lines[tid];

    // Destroy existing ghost if type changed (crossed the entry line)
    if (set.ghost && set.ghost.type !== type) {
        this._destroyShape(set.ghost.tvId);
        set.ghost = null;
    }

    if (!set.ghost) {
        const color = type === 'tp' ? '#4caf50' : '#f44336';
        const ghostId = await this._createShape(tradeId, `ghost-${type}`, price, {
            color,
            style: 2, // Dotted
            width: 1,
            text: `NEW ${type.toUpperCase()}`
        });
        if (ghostId) set.ghost = { tvId: ghostId.tvId, type, price };
    } else {
        set.ghost.price = price;
        this._updateShape(set.ghost.tvId, price, `NEW ${type.toUpperCase()}  ${fmt(price)}`);
    }
  }

  async _onNativeStop(tvId, meta) {
    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    const price = shape?.getPoints?.()?.[0]?.price;
    
    console.log(`[TradeManager] Drag Stop [750ms final]: ${meta.type} (TV:${tvId}) price=${price}`);

    if (!price || !meta.tradeId) {
        this.activeDragId = null;
        return;
    }

    if (meta.type === 'entry') {
      const trade = this.getTradeById(meta.tradeId);
      const tid = String(meta.tradeId);
      
      const ghost = this.lines[tid]?.ghost;
      if (ghost) {
          console.log(`[TradeManager] Confirming SPAWN: ${ghost.type} -> ${ghost.price} (v7.25-Pinned)`);
          this._destroyShape(ghost.tvId);
          const p = ghost.price;
          const t = ghost.type;
          this.lines[tid].ghost = null;
          await this._commitTrade(tid, t, p);
      }

      // 🛡️ v7.25 Forced Snap-Back: The Entry line never moves on the chart.
      const realEntry = Number(trade?.openPrice || trade?.price);
      if (shape && realEntry) {
          this._updateShape(tvId, realEntry, `ENTRY  ${fmt(realEntry)}`);
      }
      
      setTimeout(() => { this.activeDragId = null; }, 100); 
      return;
    }

    if (meta.type === 'sl' || meta.type === 'tp') {
        console.log(`[TradeManager] Confirming ${meta.type.toUpperCase()} DROP -> ${price}`);
        await this._commitTrade(meta.tradeId, meta.type, price);
        this._updateShape(tvId, price, `${meta.type.toUpperCase()}  ${fmt(price)}`);
    }
    
    setTimeout(() => { this.activeDragId = null; }, 500);
  }

  async syncTrades(trades, symbol = null) {
    if (this.activeDragId) return; // Locked during interaction
    if (Date.now() < this.syncLockUntil) return; // v7.28 Sync Lock (Prevent flickering during commit)

    this.trades = trades || [];
    const curSym = canonicalSymbol(symbol);
    const visible = this.trades.filter(t => canonicalSymbol(t.symbol) === curSym && !String(t._id || t.id).startsWith('temp_'));
    const visibleIds = new Set(visible.map(t => String(t._id || t.id)));

    if (!this.widget) return;
    const chart = this.widget.chart();
    const now = Date.now();

    // ─── The Vault (Graceful Removal) ──────────────────────────
    // Track when we first see a trade missing
    Object.keys(this.lines).forEach(tid => {
        if (!visibleIds.has(tid)) {
            if (!this._missingTrades[tid]) {
                this._missingTrades[tid] = now;
                console.log(`[TradeManager] Trade ${tid} missing. Starting 15s grace period.`);
            }
        } else {
            delete this._missingTrades[tid]; // Reset if it reappears
        }
    });

    // Actually remove only if missing for > 15s
    Object.keys(this._missingTrades).forEach(tid => {
        if (now - this._missingTrades[tid] > 15000) {
            console.log(`[TradeManager] Grace period expired for ${tid}. Removing lines.`);
            this.removeTradeLines(tid);
            delete this._missingTrades[tid];
        }
    });

    // Cleanup internal state for IDs that are definitively gone
    Object.keys(this.lines).forEach(tid => {
        if (!visibleIds.has(tid) && !this._missingTrades[tid]) {
            // This should only happen if removeTradeLines was already called
        }
    });

    // Sync active trades
    for (const trade of visible) {
      await this._syncTradeShapes(chart, trade);
    }
  }

  async _syncTradeShapes(chart, trade) {
    const tid = String(trade._id || trade.id);
    const entry = Number(trade.openPrice || trade.price);
    const sl = Number(trade.stopLoss || trade.sl);
    const tp = Number(trade.takeProfit || trade.tp);

    if (!this.lines[tid]) this.lines[tid] = { entry: null, sl: null, tp: null };
    const set = this.lines[tid];

    // ENTRY (Fixed position, but draggable to spawn ghosts)
    if (!set.entry) {
      set.entry = await this._createShape(tid, 'entry', entry, { color: '#2196F3', style: 0, width: 2, text: `ENTRY  ${fmt(entry)}` });
    } else {
      this._updateShape(set.entry.tvId, entry, `ENTRY  ${fmt(entry)}`);
    }

    // SL
    if (sl > 0) {
      if (!set.sl) {
        set.sl = await this._createShape(tid, 'sl', sl, { color: '#f44336', style: 1, width: 1, text: `SL  ${fmt(sl)}` });
      } else {
        this._updateShape(set.sl.tvId, sl, `SL  ${fmt(sl)}`);
      }
    } else if (set.sl) { this._destroyShape(set.sl.tvId); set.sl = null; }

    // TP
    if (tp > 0) {
      if (!set.tp) {
        set.tp = await this._createShape(tid, 'tp', tp, { color: '#4caf50', style: 1, width: 1, text: `TP  ${fmt(tp)}` });
      } else {
        this._updateShape(set.tp.tvId, tp, `TP  ${fmt(tp)}`);
      }
    } else if (set.tp) { this._destroyShape(set.tp.tvId); set.tp = null; }
  }

  async _createShape(tradeId, type, price, cfg) {
    const chart = this.widget.chart();
    try {
        const tvId = await chart.createShape(
            { price, time: Math.floor((Date.now() - 60000) / 1000) },
            {
                shape: 'horizontal_line',
                lock: false,
                disableSelection: false,
                disableSave: true,
                disableUndo: true,
                overrides: {
                    linecolor: cfg.color,
                    textcolor: cfg.color,
                    linewidth: cfg.width,
                    linestyle: cfg.style,
                    showLabel: true,
                    text: cfg.text,
                    horzLabelsAlign: 'right',
                }
            }
        );
        this.tvIdMap[tvId] = { tradeId, type };
        return { tvId, price };
    } catch (e) { return null; }
  }

  _updateShape(tvId, price, text) {
    const shape = this.widget.chart().getShapeById(tvId);
    if (!shape) return;
    this.isCommitBlocked = true;
    try {
        shape.setPoints([{ price }]);
        shape.setProperties({ overrides: { text } });
    } finally { 
        // 50ms suffocation for stray TV points_changed echoes
        setTimeout(() => { this.isCommitBlocked = false; }, 50);
    }
  }

  _destroyShape(tvId) {
    try { this.widget.chart().removeEntity(tvId); } catch {}
    delete this.tvIdMap[tvId];
  }

  removeTradeLines(tradeId) {
    const tid = String(tradeId);
    if (!this.lines[tid]) return;
    const set = this.lines[tid];

    if (set.entry) this._destroyShape(set.entry.tvId);
    if (set.sl) this._destroyShape(set.sl.tvId);
    if (set.tp) this._destroyShape(set.tp.tvId);
    if (set.ghost) this._destroyShape(set.ghost.tvId);

    delete this.lines[tid];
    console.log(`[TradeManager] Cleaned up lines for trade ${tid}`);
  }

  getTradeById(tid) {
    return this.trades.find(t => String(t._id || t.id) === tid);
  }

  async _commitTrade(tradeId, type, price) {
    const tid = String(tradeId);
    console.log(`[TradeManager] Native Commit: ${tid} ${type} -> ${price}`);
    
    // 🛡️ v7.25 State-Preserving Commit
    const trade = this.getTradeById(tid);
    if (!trade) return;

    // 🛡️ v7.28 Precision Discovery
    // Try to get instrument precision from chart to eliminate slippage
    let decimals = 5;
    try {
        const info = this.widget.activeChart().symbolInfo();
        if (info && info.pricescale) {
            decimals = Math.round(Math.log10(info.pricescale));
            if (decimals < 0) decimals = 2; // Default to 2 for things like JPY
        }
    } catch {}

    // Preserve existing value if not the one being modified
    const roundedPrice = parseFloat(price.toFixed(decimals));
    const currentSL = type === 'sl' ? roundedPrice : parseFloat(Number(trade.stopLoss || trade.sl || 0).toFixed(decimals));
    const currentTP = type === 'tp' ? roundedPrice : parseFloat(Number(trade.takeProfit || trade.tp || 0).toFixed(decimals));

    console.log('%c [TradeManager] 🎯 ZERO-SLIPPAGE PAYLOAD ', 'background: #4caf50; color: white; padding: 2px 4px;', { 
        action: type.toUpperCase(), 
        rawDragValue: price, 
        roundedPayloadSent: roundedPrice,
        decimalsApplied: decimals 
    });

    const payload = { 
        tradeId: tid,
        sl: currentSL,
        tp: currentTP
    };

    const token = getAuthToken();
    if (!token) return;

    // 🛡️ v7.28 Engage Sync Lock
    this.syncLockUntil = Date.now() + 2500; 

    try {
      const res = await fetch(`${API_URL}/trade/modify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && this.onTradeModify) {
        this.onTradeModify({ tradeId: tid, sl: currentSL, tp: currentTP });
      }
    } catch (e) {
      console.error('[TradeManager] Commit error:', e);
    }
  }
}
