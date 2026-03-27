import { API_URL } from '../config/api';

/**
 * ============================================================
 * TradeLineManager v7.28 ΓÇö Phase 66: THE PERFECTIONIST
 * ============================================================
 * v7.28 Perfectionist:
 * - Sync Lock (2.5s guard after commit to prevent flicker)
 * - Dynamic Precision (Instrument-aware decimal places)
 * - Absolute Entry Pinning (Snap-back refinement)
 * - State-Preserving Commits (Merge SL/TP)
 * ============================================================
 */
// ΓöÇΓöÇΓöÇ Auth ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
window.TRADE_ENGINE_VERSION = '7.28-PERFECT';
console.log('%c [TradeManager v7.45] PERFECTIONIST ENGINE ACTIVE ', 'background: #222; color: #e91e63; font-size: 20px;');

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

// ΓöÇΓöÇΓöÇ Symbol normalization ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const canonicalSymbol = (raw) => {
  const v = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!v) return '';
  if (/^[A-Z]{6}/.test(v)) return v.slice(0, 6);
  return v;
};

// ΓöÇΓöÇΓöÇ Price formatting ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const fmt = (price) => {
  if (!Number.isFinite(price)) return '0.00';
  return price > 100 ? price.toFixed(2) : price.toFixed(5);
};

// ΓöÇΓöÇΓöÇ Debounce ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const debounce = (fn, ms) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    this.syncLockUntil = 0; // v7.28 Anti-Flicker lock
    this._adminSpreads = {};

    console.log('[TradeManager v7.45] Perfectionist Engine Initialized');
  }

  setAdminSpreads(spreads) {
    this._adminSpreads = spreads || {};
    console.log('[TradeManager] Admin spreads updated', Object.keys(this._adminSpreads).length);
  }

  initialize(widget) {
    this.widget = widget;
    this._attachEvents(widget);
  }

  destroy() {
    if (this.widget && this._handler) {
      try { this.widget.unsubscribe('drawing_event', this._handler); } catch(e) {}
    }
    this.clearAllManagedDrawings();
  }

  // ΓöÇΓöÇΓöÇ Events ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  _attachEvents(widget) {
    this.commitTimers = {};

    this._handler = (id, status) => {
      const tvId = String(id);
      const meta = this.tvIdMap[tvId];
      if (!meta || this.isCommitBlocked) return;

      const action = String(status?.status || status || '').toLowerCase();
      
      // Stop logging spammy points_changed and move events
      if (action !== 'points_changed' && action !== 'move') {
          console.log(`[TradeManager] EVENT: ${tvId} (${meta.type}) status="${action}"`);
      }

      if (action === 'started') {
        this.activeDragId = meta.tradeId;
        const shape = widget.chart().getShapeById(tvId);
        const p = shape?.getPoints?.()?.[0]?.price;
        this.dragStartPrice = Number.isFinite(p) ? p : 0;
        
        // ≡ƒ¢í∩╕Å v7.46 Selection Guard: Immediately clear selection to hide floating toolbox
        // This prevents the "Delete/Trash" and "Settings" icons from appearing while dragging.
        setTimeout(() => {
          try { widget.chart().clearSelection(); } catch(e) {}
        }, 10);
      }

      // ≡ƒ¢í∩╕Å v7.46 Deletion Guard: If the user bypasses UI and deletes a line, re-sync to restore it.
      if (action === 'remove' && !this.isCommitBlocked) {
          console.log(`[TradeManager] UI deletion detected for ${meta.type}. Triggering restoration sync.`);
          setTimeout(() => this.syncTrades(this.trades), 100);
      }

      // ≡ƒ¢í∩╕Å v7.32 Track BOTH move and points_changed to guarantee we never miss a final drag endpoint!
      if (action === 'points_changed' || action === 'move') {
          if (meta.type === 'entry') this._onNativeMove(tvId, meta); // spawn ghost

          if (this.commitTimers[tvId]) clearTimeout(this.commitTimers[tvId]);
          this.commitTimers[tvId] = setTimeout(() => {
              this._onNativeStop(tvId, meta);
          }, 50); // ≡ƒ¢í∩╕Å v7.33 Ultra-fast 200ms user interaction response
      }
    };
    widget.subscribe('drawing_event', this._handler);
  }

  async _onNativeMove(tvId, meta) {
    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    const price = shape?.getPoints?.()?.[0]?.price;
    if (!price || !Number.isFinite(price) || this.isUpdatingGhost) return;

    // ΓöÇΓöÇΓöÇ MT5 Ghosting (Spawn Logic) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
        this._updateShape(set.ghost.tvId, price);
    }
  }

  async _onNativeStop(tvId, meta) {
    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    const price = shape?.getPoints?.()?.[0]?.price;
    
    console.log(`[TradeManager] Drag Stop [200ms final]: ${meta.type} (TV:${tvId}) price=${price}`);

    if (!price || !meta.tradeId) {
        this.activeDragId = null;
        return;
    }

    if (meta.type === 'entry') {
      const trade = this.getTradeById(meta.tradeId);
      const tid = String(meta.tradeId);
      
      const ghost = this.lines[tid]?.ghost;
      if (ghost) {
          this._destroyShape(ghost.tvId);
          this.lines[tid].ghost = null;
          
          // ≡ƒ¢í∩╕Å v7.35 Absolute Final Target Verification
          // Recalculating the drop classification here completely bypasses any visual lag or frame-drops 
          // that might have caused the temporary Ghost shape to misread the ultimate destination.
          const side = String(trade.side || trade.type || '').toLowerCase();
          const isBuy = side.includes('buy') || side.includes('long');
          const entryPrice = Number(trade.openPrice || trade.price);
          const t = isBuy ? (price > entryPrice ? 'tp' : 'sl') : (price < entryPrice ? 'tp' : 'sl');

          console.log(`[TradeManager] Confirming EXACT SPAWN: ${t.toUpperCase()} -> ${price} (Targeted)`);
          
          // Γ£¿ OPTIMISTIC RAW PLOT
          if (this.lines[tid][t]) {
              this._updateShape(this.lines[tid][t].tvId, price);
          } else {
              const color = t === 'tp' ? '#4caf50' : '#f44336';
              const shapeRef = await this._createShape(tid, t, price, {
                  color, style: 1, width: 2, text: `${t.toUpperCase()}`
              });
              this.lines[tid][t] = shapeRef;
          }

          await this._commitTrade(tid, t, price); // Network execution
      }

      // ≡ƒ¢í∩╕Å v7.25 Forced Snap-Back: The Entry line never moves on the chart.
      const realEntry = Number(trade?.openPrice || trade?.price);
      if (shape && realEntry) {
          this._updateShape(tvId, realEntry);
      }
      
      setTimeout(() => { this.activeDragId = null; }, 100); 
      return;
    }

    if (meta.type === 'sl' || meta.type === 'tp') {
        console.log(`[TradeManager] Confirming ${meta.type.toUpperCase()} DROP -> ${price}`);
        this._updateShape(tvId, price);
        await this._commitTrade(meta.tradeId, meta.type, price);
    }
    
    setTimeout(() => { this.activeDragId = null; }, 200);
  }

  async syncTrades(trades, symbol = null) {
    if (this.activeDragId) return; // Locked during interaction
    
    // ≡ƒ¢í∩╕Å v7.46 Instant Cleanup Bypass
    // If trade count decreased, someone closed a trade. We MUST bypass the 2.5s sync-lock
    // to remove the lines immediately, otherwise they linger until the timer expires.
    const hasClosures = (trades || []).length < this.trades.length;

    if (Date.now() < this.syncLockUntil && !hasClosures) return; 

    this.trades = trades || [];
    
    // ≡ƒ¢í∩╕Å v7.48 Emergency: If trade list is empty, Nuke everything immediately.
    if (this.trades.length === 0) {
        console.log('[TradeManager] Trade list empty. Clearing all chart entities.');
        this.clearAllManagedDrawings();
        return;
    }

    const curSym = canonicalSymbol(symbol);
    const visible = this.trades.filter(t => canonicalSymbol(t.symbol) === curSym && !String(t._id || t.id).startsWith('temp_'));
    const visibleIds = new Set(visible.map(t => String(t._id || t.id)));
    const allAccountTradeIds = new Set(this.trades.map(t => String(t._id || t.id)));

    if (!this.widget) return;
    const chart = this.widget.chart();
    const now = Date.now();

    // ΓöÇΓöÇΓöÇ Deep Cleanup (Safeguard) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    // Scan all shapes the manager knows about. 
    // If a drawing belongs to a trade that no longer exists in the account, delete it.
    Object.keys(this.tvIdMap).forEach(tvId => {
        const meta = this.tvIdMap[tvId];
        if (meta && !allAccountTradeIds.has(String(meta.tradeId))) {
            console.log(`[TradeManager] Stray drawing detected (Trade ${meta.tradeId} closed). Purging entity ${tvId}`);
            this._destroyShape(tvId);
            if (this.lines[meta.tradeId]) delete this.lines[meta.tradeId];
        }
    });

    // ΓöÇΓöÇΓöÇ Orphan Cleanup (Current Symbol) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    Object.keys(this.lines).forEach(tid => {
        if (!visibleIds.has(tid)) {
            console.log(`[TradeManager] Trade ${tid} closed/missing for ${curSym}. Instant cleanup.`);
            this.removeTradeLines(tid);
        }
    });

    // Sync active trades
    for (const trade of visible) {
      await this._syncTradeShapes(chart, trade);
    }
  }

  clearAllManagedDrawings() {
      console.log('[TradeManager] Executing Alpha-Level ClearAll...');
      Object.keys(this.lines).forEach(tid => this.removeTradeLines(tid));
      // Safeguard for anything missed by removeTradeLines
      Object.keys(this.tvIdMap).forEach(tvId => this._destroyShape(tvId));
      this.lines = {};
      this.tvIdMap = {};
  }

  async _syncTradeShapes(chart, trade) {
    const tid = String(trade._id || trade.id);
    const entry = Number(trade.openPrice || trade.price);
    const sl = Number(trade.stopLoss || trade.sl);
    const tp = Number(trade.takeProfit || trade.tp);

    if (!Number.isFinite(entry)) return;

    if (!this.lines[tid]) this.lines[tid] = { entry: null, sl: null, tp: null };
    const set = this.lines[tid];

    // ENTRY (Fixed position, but draggable to spawn ghosts)
    const side = String(trade.side || trade.type || '').toLowerCase();
    const isBuy = side.includes('buy') || side.includes('long');
    const labelText = `${isBuy ? 'BUY' : 'SELL'} ${fmt(entry)}`;

    if (!set.entry) {
      set.entry = await this._createShape(tid, 'entry', entry, { 
        color: '#2196F3', 
        style: 1, 
        width: 2, 
        text: labelText,
        selectable: false // ≡ƒ¢í∩╕Å v7.46 Stationary Anchor: Entry lines cannot be selected/deleted.
      });
    } else {
      this._updateShape(set.entry.tvId, entry, labelText);
    }

    // SL
    if (Number.isFinite(sl) && sl > 0) {
      if (!set.sl) {
        set.sl = await this._createShape(tid, 'sl', sl, { color: '#f44336', style: 1, width: 2, text: `SL` });
      } else {
        this._updateShape(set.sl.tvId, sl);
      }
    } else if (set.sl) { this._destroyShape(set.sl.tvId); set.sl = null; }

    // TP
    if (Number.isFinite(tp) && tp > 0) {
      if (!set.tp) {
        set.tp = await this._createShape(tid, 'tp', tp, { color: '#4caf50', style: 1, width: 2, text: `TP` });
      } else {
        this._updateShape(set.tp.tvId, tp);
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
                disableSelection: cfg.selectable === false, // ≡ƒ¢í∩╕Å v7.46 UI Guard
                disableSave: true,
                disableUndo: true,
                overrides: {
                    linecolor: cfg.color,
                    textcolor: cfg.color,
                    linewidth: cfg.width,
                    linestyle: cfg.style,
                    showLabel: true,
                    text: cfg.text,
                    horzLabelsAlign: 'left',
                }
            }
        );
        this.tvIdMap[tvId] = { tradeId, type };
        return { tvId, price };
    } catch (e) { return null; }
  }

  _updateShape(tvId, price, text = null) {
    const shape = this.widget.chart().getShapeById(tvId);
    if (!shape) return;
    this.isCommitBlocked = true;
    try {
        shape.setPoints([{ price }]);
        if (text) shape.setProperties({ overrides: { text } });
    } finally { 
        // 50ms suffocation for stray TV points_changed echoes
        setTimeout(() => { this.isCommitBlocked = false; }, 50);
    }
  }

  _destroyShape(tvId) {
    if (!tvId) return;
    try { 
        const chart = this.widget.chart();
        chart.removeEntity(tvId); 
        // ≡ƒ¢í∩╕Å v7.48 Double-Tap Deletion: Some shapes linger if deleted during a render cycle.
        // We fire a second cleanup 100ms later to ensure the entity is gone.
        setTimeout(() => {
            try { chart.removeEntity(tvId); } catch(e) {}
        }, 100);
    } catch (e) {}
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
    
    // ≡ƒ¢í∩╕Å v7.25 State-Preserving Commit
    const trade = this.getTradeById(tid);
    if (!trade) return;

    // ≡ƒ¢í∩╕Å v7.28 Precision Discovery
    // Try to get instrument precision from chart to eliminate slippage
    let decimals = 5;
    try {
        const info = this.widget.activeChart().symbolInfo();
        if (info && info.pricescale) {
            decimals = Math.round(Math.log10(info.pricescale));
            if (decimals < 0) decimals = 2; // Default to 2 for things like JPY
        }
    } catch {}

    // ≡ƒ¢í∩╕Å v7.36 Ultimate State Integrity
    // Use physical TV shapes as the primary fallback to prevent asynchronous Redux lag from overwriting new lines with zeros!
    let fallbackSL = trade.stopLoss || trade.sl || 0;
    if (this.lines[tid]?.sl?.tvId) {
        try {
            const slShape = this.widget.chart().getShapeById(this.lines[tid].sl.tvId);
            const p = slShape?.getPoints?.()?.[0]?.price;
            if (Number.isFinite(p)) fallbackSL = p;
        } catch {}
    }

    let fallbackTP = trade.takeProfit || trade.tp || 0;
    if (this.lines[tid]?.tp?.tvId) {
        try {
            const tpShape = this.widget.chart().getShapeById(this.lines[tid].tp.tvId);
            const p = tpShape?.getPoints?.()?.[0]?.price;
            if (Number.isFinite(p)) fallbackTP = p;
        } catch {}
    }

    const roundedPrice = parseFloat(price.toFixed(decimals));
    const currentSL = type === 'sl' ? roundedPrice : parseFloat(Number(fallbackSL).toFixed(decimals));
    const currentTP = type === 'tp' ? roundedPrice : parseFloat(Number(fallbackTP).toFixed(decimals));

    console.log('%c [TradeManager] ≡ƒÄ» ZERO-SLIPPAGE PAYLOAD ', 'background: #4caf50; color: white; padding: 2px 4px;', { 
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

    // ≡ƒ¢í∩╕Å v7.28 Engage Sync Lock
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
