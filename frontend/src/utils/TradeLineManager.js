import { API_URL } from '../config/api';
import { getInstrumentInfo, roundPrice } from './precision';
import { canonicalSymbol } from './symbolUtils';

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
window.TRADE_ENGINE_VERSION = '7.53-ACTIVE';
console.log("%c [TradeManager] v7.53 SL/TP ENGINE ACTIVE ", "background: #1a1a1a; color: #00ff00; font-weight: bold; padding: 4px; border-radius: 4px;");

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
    
    this.activeDragId = null;
    this.dragStartPrice = 0;
    this.isUpdatingGhost = false;
    this.syncLockUntil = 0;
    this._adminSpreads = {};
    this._lastPrices = {}; // canonicalSymbol -> { bid, ask }
  }

  setAdminSpreads(spreads) {
    this._adminSpreads = spreads || {};
  }

  initialize(widget) {
    this.widget = widget;
    this._attachEvents(widget);
    
    // v7.80 Fossil Cleanup: Purge baked-in lines from chart save state on refresh.
    // CRITICAL: skip any shape that is already tracked in tvIdMap — those are LIVE managed lines
    // created by syncTrades. Deleting them leaves set.tp/sl with a dead tvId (since _destroyShape
    // is not called), causing _updateShape to silently fail and the line to vanish permanently.
    //Sanket v2.0 - Only remove shapes that are NOT in tvIdMap (true fossils, not managed lines)
    setTimeout(() => {
        try {
            const chart = widget.chart();
            const shapes = chart.getAllShapes();
            shapes.forEach(shape => {
                if (this.tvIdMap[shape.id]) return; // Skip managed shapes — never delete live lines
                const entity = chart.getShapeById(shape.id);
                const props = entity?.getProperties?.();
                if (props && props.text) {
                    const text = String(props.text).toUpperCase();
                    if (text === 'TP' || text === 'SL' || text.includes('BUY ') || text.includes('SELL ') || text.includes('NEW TP') || text.includes('NEW SL')) {
                        chart.removeEntity(shape.id);
                    }
                }
            });
        } catch (e) {}
    }, 1500); 
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
      
      // v7.51 Silent Mode

      if (action === 'started') {
        this.activeDragId = meta.tradeId;
        let shape;
        try {
          shape = widget.chart().getShapeById(tvId);
        } catch (e) {
          this.activeDragId = null;
          return;
        }
        const p = shape?.getPoints?.()?.[0]?.price;
        this.dragStartPrice = Number.isFinite(p) ? p : 0;
      }

      // v7.51 Restore Guard
      // Sanket v2.0 - Skip restore if WE triggered the removal (ghost cleanup etc.), and always pass current symbol so canonicalSymbol(null) does not wipe all lines
      if (action === 'remove' && !this.isCommitBlocked) {
          if (this._ownRemovals?.has(tvId)) return;
          const sym = this.widget?.symbolInterval?.()?.symbol;
          setTimeout(() => this.syncTrades(this.trades, sym), 100);
      }

      // ≡ƒ¢í∩╕Å v7.32 Track BOTH move and points_changed to guarantee we never miss a final drag endpoint!
      if (action === 'points_changed' || action === 'move') {
          if (meta.type === 'entry') this._onNativeMove(tvId, meta); // spawn ghost

          if (this.commitTimers[tvId]) clearTimeout(this.commitTimers[tvId]);
          this.commitTimers[tvId] = setTimeout(() => {
              this._onNativeStop(tvId, meta);
          }, 250); // ≡ƒ¢í∩╕Å v7.47 Stabilized interaction lock
      }
    };
    widget.subscribe('drawing_event', this._handler);
  }

  async _onNativeMove(tvId, meta) {
    const chart = this.widget.chart();
    let shape;
    try {
      shape = chart.getShapeById(tvId);
    } catch (e) { return; }
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
    let shape;
    try {
      shape = chart.getShapeById(tvId);
    } catch (e) {
      this.activeDragId = null;
      return;
    }
    const price = shape?.getPoints?.()?.[0]?.price;

    if (!price || !meta.tradeId) {
        this.activeDragId = null;
        return;
    }

    try {
        if (meta.type === 'entry') {
          const trade = this.getTradeById(meta.tradeId);
          const tid = String(meta.tradeId);
          
          const ghost = this.lines[tid]?.ghost;
          if (ghost) {
              this._destroyShape(ghost.tvId);
              this.lines[tid].ghost = null;
              
              // v7.53 Hardened side detection with price-based fallback
              const sideStr = String(trade.side || trade.type || trade.action || trade.orderType || '').toLowerCase();
              const entryPrice = Number(trade.openPrice || trade.price);
              
              let isBuy = sideStr.includes('buy') || sideStr.includes('long');
              // Fallback: If side is ambiguous, infer from current position vs entry
              if (!sideStr && price !== entryPrice) {
                  isBuy = price > entryPrice; 
              }
              
              const symbol = this.widget.symbolInterval().symbol;
              const { pricescale } = getInstrumentInfo(symbol);
              const epsilon = 5 / (pricescale * 10); // 0.5 pip epsilon for better drag stability
              
              let t = null;
              if (isBuy) {
                  if (price > entryPrice + epsilon) t = 'tp';
                  else if (price < entryPrice - epsilon) t = 'sl';
                  else return;
              } else {
                  if (price < entryPrice - epsilon) t = 'tp';
                  else if (price > entryPrice + epsilon) t = 'sl';
                  else return;
              }

              if (this.lines[tid][t]) {
                  this._updateShape(this.lines[tid][t].tvId, price);
              } else {
                  const color = t === 'tp' ? '#4caf50' : '#f44336';
                  const shapeRef = await this._createShape(tid, t, price, {
                      color, style: 1, width: 2, text: `${t.toUpperCase()}`
                  });
                  this.lines[tid][t] = shapeRef;
              }

                  //Sanket v2.0 - Multi-trade safety guard: reject commits that are already triggerable
                  // at the current live bid/ask. On crowded charts with overlapping SL/TP lines,
                  // users can accidentally drag the wrong trade's line. Without this check, backend
                  // accepts the new SL/TP and the trade closes on the very next engine cycle.
                  if (!this._isSafeLevelForCurrentPrice(trade, t, price)) {
                    const original = t === 'sl'
                    ? Number(trade.stopLoss || trade.sl || 0)
                    : Number(trade.takeProfit || trade.tp || 0);
                    if (Number.isFinite(original) && original > 0 && this.lines[tid][t]) {
                      this._updateShape(this.lines[tid][t].tvId, original);
                    }
                    return;
                  }

              await this._commitTrade(tid, t, price); 
          }

          const realEntry = Number(trade?.openPrice || trade?.price);
          if (shape && realEntry) {
              this._updateShape(tvId, realEntry);
          }
          return;
        }

        if (meta.type === 'sl' || meta.type === 'tp') {
          const trade = this.getTradeById(meta.tradeId);
          if (trade && !this._isSafeLevelForCurrentPrice(trade, meta.type, price)) {
            const original = meta.type === 'sl'
              ? Number(trade.stopLoss || trade.sl || 0)
              : Number(trade.takeProfit || trade.tp || 0);
            if (Number.isFinite(original) && original > 0) {
              this._updateShape(tvId, original);
            }
            return;
          }
            this._updateShape(tvId, price);
            await this._commitTrade(meta.tradeId, meta.type, price);
        }
    } finally {
        this.activeDragId = null;
    }
  }

  async syncTrades(trades, symbol = null) {
    if (this.activeDragId) return; // Locked during interaction
    
    // ≡ƒ¢í∩╕Å v7.46 Instant Cleanup Bypass
    // If trade count decreased, someone closed a trade. We MUST bypass the 2.5s sync-lock
    // to remove the lines immediately, otherwise they linger until the timer expires.
    const hasClosures = (trades || []).length < this.trades.length;

    if (Date.now() < this.syncLockUntil && !hasClosures) return; 

    this.trades = trades || [];
    
    // v7.48 Emergency
    if (this.trades.length === 0) {
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
            this._destroyShape(tvId);
            if (this.lines[meta.tradeId]) delete this.lines[meta.tradeId];
        }
    });

    // ΓöÇΓöÇΓöÇ Orphan Cleanup (Current Symbol) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    Object.keys(this.lines).forEach(tid => {
        if (!visibleIds.has(tid)) {
            this.removeTradeLines(tid);
        }
    });

    // Sync active trades
    for (const trade of visible) {
      await this._syncTradeShapes(chart, trade);
    }
  }

  clearAllManagedDrawings() {
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
      //Sanket v2.0 - Dead-reference guard for entry line. Same pattern as SL/TP below.
      // Without this, an entry shape removed externally (fossil cleanup, chart re-init, widget.load)
      // leaves set.entry pointing to a dead tvId. _updateShape returns silently, the entry line
      // never redraws, and the next syncTrades cycle finds set.entry truthy so it never recreates.
      let entryExists = false;
      try { entryExists = !!this.widget.chart().getShapeById(set.entry.tvId); } catch(e) {}
      if (!entryExists) {
        delete this.tvIdMap[set.entry.tvId];
        set.entry = null;
        set.entry = await this._createShape(tid, 'entry', entry, { color: '#2196F3', style: 1, width: 2, text: labelText, selectable: false });
      } else {
        this._updateShape(set.entry.tvId, entry, labelText);
      }
    }

    //Sanket v2.0 - Race condition guard: clearAllManagedDrawings() can be called while this async
    // function is awaiting _createShape (e.g. trades briefly becomes [] between render cycles).
    // After the await resolves, this.lines[tid] may have been deleted. If we continue writing to
    // the stale local `set` reference, the new shape is registered in tvIdMap but orphaned from
    // lines, creating a phantom shape that is never cleaned up and causes duplicate lines on the
    // next sync. Abort early and let the next syncTrades cycle recreate lines cleanly.
    if (!this.lines[tid]) {
      if (set.entry) { this._destroyShape(set.entry.tvId); set.entry = null; }
      return;
    }

    // SL
    if (Number.isFinite(sl) && sl > 0) {
      if (!set.sl) {
        set.sl = await this._createShape(tid, 'sl', sl, { color: '#f44336', style: 1, width: 2, text: `SL` });
      } else {
        //Sanket v2.0 - Verify the TV shape still exists before updating. If the shape was removed
        // externally (fossil cleanup, chart clear, widget re-init) _updateShape silently fails and
        // set.sl stays non-null forever — the line never re-appears AND a second orphan can form
        // if set.sl is later nulled while the ghost shape persists on the chart.
        let slExists = false;
        try { slExists = !!this.widget.chart().getShapeById(set.sl.tvId); } catch(e) {}
        if (!slExists) {
          delete this.tvIdMap[set.sl.tvId];
          set.sl = null;
          set.sl = await this._createShape(tid, 'sl', sl, { color: '#f44336', style: 1, width: 2, text: `SL` });
        } else {
          this._updateShape(set.sl.tvId, sl);
        }
      }
    } else if (set.sl) { this._destroyShape(set.sl.tvId); set.sl = null; }

    // Race condition guard after SL await
    if (!this.lines[tid]) {
      if (set.sl) { this._destroyShape(set.sl.tvId); set.sl = null; }
      return;
    }

    // TP
    if (Number.isFinite(tp) && tp > 0) {
      if (!set.tp) {
        set.tp = await this._createShape(tid, 'tp', tp, { color: '#4caf50', style: 1, width: 2, text: `TP` });
      } else {
        //Sanket v2.0 - Same dead-reference guard as SL above. Without this, a TP moved by drag
        // then externally destroyed leaves set.tp pointing to a dead tvId. _updateShape silently
        // returns, the TP never redraws, AND the orphaned ghost shape at the old price stays on
        // screen — causing the "two TP lines" symptom (old ghost + newly created managed line).
        let tpExists = false;
        try { tpExists = !!this.widget.chart().getShapeById(set.tp.tvId); } catch(e) {}
        if (!tpExists) {
          delete this.tvIdMap[set.tp.tvId];
          set.tp = null;
          set.tp = await this._createShape(tid, 'tp', tp, { color: '#4caf50', style: 1, width: 2, text: `TP` });
        } else {
          this._updateShape(set.tp.tvId, tp);
        }
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
        //Sanket v2.0 - Guard against null tvId: createShape returns null when the chart is still
        // processing a widget.load() or in a non-interactive state. If we store tvIdMap[null],
        // every subsequent lookup (getShapeById, removeEntity) silently fails and the shape is
        // stuck in a zombie "non-null set.entry" state that never retries creation.
        if (!tvId) return null;
        this.tvIdMap[tvId] = { tradeId, type };
        return { tvId, price };
    } catch (e) { return null; }
  }

  _updateShape(tvId, price, text = null) {
    if (!this.widget) return;
    try {
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
    } catch (e) {
      // Silently fail if shape is gone (likely a refresh/cleanup race)
    }
  }

  _destroyShape(tvId) {
    if (!tvId) return;
    // Sanket v2.0 - Mark as own removal so the drawing_event 'remove' handler does not trigger a symbol-less syncTrades and wipe all visible lines
    if (!this._ownRemovals) this._ownRemovals = new Set();
    this._ownRemovals.add(tvId);
    setTimeout(() => this._ownRemovals?.delete(tvId), 500);
    //Sanket v2.0 - Removed the 100ms double-tap deletion. The double-tap called removeEntity on an
    // ID that TV had already deleted from the first call. TV fires "Can't find a source with id"
    // for every double-tap → each error triggered the drawing_event 'remove' handler → handler
    // called syncTrades → syncTrades ran removeTradeLines → _destroyShape on freshly created
    // SL/TP shapes → those fresh shapes also got double-tapped → cascade wipe of all lines.
    // Single removeEntity is sufficient; TV processes it synchronously within the same frame.
    try {
        this.widget?.chart()?.removeEntity(tvId);
    } catch(e) {}
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
  }

  getTradeById(tid) {
    return this.trades.find(t => String(t._id || t.id) === tid);
  }

  _isSafeLevelForCurrentPrice(trade, type, price) {
    //Sanket v2.0 - Validation uses current live bid/ask to prevent an immediate SL/TP trigger.
    // This is especially critical on multi-trade charts where lines overlap and a wrong drag can
    // otherwise close a different open trade instantly.
    if (!trade || !type || !Number.isFinite(price)) return true;

    const sym = canonicalSymbol(trade.symbol || this.widget?.symbolInterval?.()?.symbol);
    const live = this._lastPrices[sym];
    const bid = Number(live?.bid);
    const ask = Number(live?.ask);
    if (!Number.isFinite(bid) || !Number.isFinite(ask)) return true;

    const side = String(trade.side || trade.type || '').toLowerCase();
    const isBuy = side.includes('buy') || side.includes('long');
    const { pricescale } = getInstrumentInfo(sym || 'XAUUSD');
    const epsilon = 5 / (pricescale * 10); // 0.5 pip safety buffer

    if (isBuy && type === 'sl') return price < (bid - epsilon);
    if (isBuy && type === 'tp') return price > (bid + epsilon);
    if (!isBuy && type === 'sl') return price > (ask + epsilon);
    if (!isBuy && type === 'tp') return price < (ask - epsilon);
    return true;
  }

  async _commitTrade(tradeId, type, price) {
    const tid = String(tradeId);
    
    //Sanket v2.0 - Guard against destroyed widget. _commitTrade is called via a 250ms setTimeout.
    // By the time the timer fires, the widget may have been destroyed (e.g., component unmount,
    // theme change forcing widget rebuild). Without this guard, the symbolInterval() call throws
    // a TypeError which propagates as an unhandled rejection and silently kills the commit.
    if (!this.widget) return;

    // v7.51 State-Preserving Commit
    const trade = this.getTradeById(tid);
    if (!trade) return;

    // ≡ƒ¢í∩╕Å v7.28 Precision Discovery
    // Use shared utility to get correct rounding decimals for the instrument
    const symbol = this.widget.symbolInterval().symbol;
    const { decimals } = getInstrumentInfo(symbol);

    // ≡ƒ¢í∩╕Å v7.36 Ultimate State Integrity
    // Use physical TV shapes as the primary fallback to prevent asynchronous Redux lag from overwriting new lines with zeros!
    let fallbackSL = trade.stopLoss || trade.sl || 0;
    if (this.lines[tid]?.sl?.tvId) {
        try {
            const slShape = this.widget.chart().getShapeById(this.lines[tid].sl.tvId);
            const p = slShape?.getPoints?.()?.[0]?.price;
            if (Number.isFinite(p)) fallbackSL = p;
        } catch (e) {
            // Shape not found, use stored trade value
        }
    }

    let fallbackTP = trade.takeProfit || trade.tp || 0;
    if (this.lines[tid]?.tp?.tvId) {
        try {
            const tpShape = this.widget.chart().getShapeById(this.lines[tid].tp.tvId);
            const p = tpShape?.getPoints?.()?.[0]?.price;
            if (Number.isFinite(p)) fallbackTP = p;
        } catch (e) {
            // Shape not found, use stored trade value
        }
    }

    const roundedPrice = parseFloat(price.toFixed(decimals));
    const currentSL = type === 'sl' ? roundedPrice : parseFloat(Number(fallbackSL).toFixed(decimals));
    const currentTP = type === 'tp' ? roundedPrice : parseFloat(Number(fallbackTP).toFixed(decimals));

    // ≡ƒ¢í∩╕Å v7.48 Payload Guard: Never send invalid or infinite values to the backend
    // v7.51 Silent Payload Preparation

    const payload = { 
        tradeId: tid,
        sl: currentSL || 0,
        tp: currentTP || 0
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
        console.log(`[TradeManager] SUCCESS: Trade ${tid} modified (${type} -> ${roundedPrice})`);
        this.onTradeModify({ tradeId: tid, sl: currentSL, tp: currentTP });
      } else {
        console.warn(`[TradeManager] FAILED: ${data.message || 'Unknown backend error'}`);
      }
    } catch (e) {
      console.error(`[TradeManager] ERROR: Network or parse failure during commit`, e);
    }
  }

  updateLivePrice(symbol, prices) {
    if (!this.widget || !this.trades || this.trades.length === 0 || !prices) return;
    
    const curSym = canonicalSymbol(symbol);
    const visibleTrades = this.trades.filter(t => canonicalSymbol(t.symbol) === curSym);

    // Support both single numeric price (legacy) and dual price object
    const bid = typeof prices === 'object' ? prices.bid : prices;
    const ask = typeof prices === 'object' ? prices.ask : prices;

    if (Number.isFinite(Number(bid)) && Number.isFinite(Number(ask))) {
      this._lastPrices[curSym] = { bid: Number(bid), ask: Number(ask) };
    }

    visibleTrades.forEach(trade => {
      const tid = String(trade._id || trade.id);
      const set = this.lines[tid];
      if (!set || !set.entry) return;

      const side = String(trade.side || trade.type || '').toLowerCase();
      const isBuy = side.includes('buy') || side.includes('long');
      
      const entryAsk = trade.entryAsk || trade.openPrice || trade.price || 0;
      const entryBid = trade.entryBid || trade.openPrice || trade.price || 0;
      const quantity = trade.quantity || trade.size || trade.lots || 0;
      const contractSize = trade.contractSize || 100000;
      
      let pnl = 0;
      if (isBuy) {
        // BUY: Closes at Bid against EntryAsk
        pnl = (bid - entryAsk) * quantity * contractSize;
      } else {
        // SELL: Closes at Ask against EntryBid
        pnl = (entryBid - ask) * quantity * contractSize;
      }

      // Include commission/swap if available
      const finalPnl = pnl - (trade.commission || 0) - (trade.swap || 0);
      
      const pnlText = finalPnl >= 0 ? `+$${finalPnl.toFixed(2)}` : `-$${Math.abs(finalPnl).toFixed(2)}`;
      const labelText = `${isBuy ? 'BUY' : 'SELL'} ${quantity} | ${pnlText}`;

      //Sanket v2.0 - CRITICAL: Do NOT call _updateShape here. _updateShape calls setPoints() which
      // triggers TV's drawing_event 'points_changed' echo → _handler sets isCommitBlocked=true for
      // 50ms. useInterpolation runs at 60fps (~16ms per frame), so _updateShape is called every 16ms.
      // Since 16ms < 50ms reset timer, each frame re-sets isCommitBlocked=true before the previous
      // timer clears it → isCommitBlocked is PERMANENTLY TRUE during live tick flow → every user
      // drag event (started/move/points_changed) is silently swallowed → SL/TP never responds.
      // The entry price (trade.openPrice) never changes anyway, so setPoints is a no-op price-wise.
      // Only the label text changes → use setProperties text-only, which does NOT trigger any echo.
      this._updateShapeLabel(set.entry.tvId, labelText);
    });
  }

  _updateShapeLabel(tvId, text) {
    //Sanket v2.0 - Text-only label update. Does NOT call setPoints so TV never fires points_changed.
    // Safe to call at 60fps without affecting isCommitBlocked or any drag interaction.
    if (!this.widget || !tvId || !text) return;
    try {
      const shape = this.widget.chart().getShapeById(tvId);
      if (!shape) return;
      shape.setProperties({ overrides: { text } });
    } catch (e) {}
  }
}
