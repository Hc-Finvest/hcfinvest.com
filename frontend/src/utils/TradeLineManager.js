import { canonicalSymbol } from './symbolUtils';
import { getAdminMarkupValue, unwrapRetailPrice } from './priceUtils';

const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const API_URL = base.endsWith('/api') ? base : `${base}/api`;

const getAuthToken = () => localStorage.getItem('token');

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
    this.lines = {}; // tradeId -> { entry, sl, tp, ghost, entryGhost }
    this.tvIdMap = {}; // tvId -> { tradeId, type }
    this.widget = null;
    this.chart = null;
    this.trades = [];
    this.syncLockUntil = 0;
    this.syncLockDuration = 3000; // 🛡️ Phase 34: 3s lock to prevent jitter
    this.activeDragId = null;
    this.dragStartPrice = 0;
    this.isUpdatingGhost = false;
    this.isCommitBlocked = false; // Keep this for _updateShape

    // Sanket v2.0 - drag state machine: prevents overlapping operations
    this.dragState = {
        active: false,           // Is user currently dragging?
        tradeId: null,           // Which trade is being dragged?
        type: null,              // 'entry', 'sl', 'tp'
        startPrice: 0,           // Price at drag start
        currentPrice: 0,         // Current drag position
        operation: null,         // 'creating-ghost', 'updating', 'committing'
    };

    // Sanket v2.0 - adaptive sync lock based on network speed
    this.syncLockDuration = 1200;      // Base lock duration
    this.lastCommitTime = 0;           // Track response speeds
    this.avgResponseTime = 0;          // Rolling average

    this.isInternalUpdate = false; // 🛡️ Safety: Recursion guard
    this.entryAnchors = {}; // 🏗️ Phase 33: track stationary visual anchors { tradeId: tvId }
    this._adminSpreads = {};
  }

  setAdminSpreads(spreads) {
    this._adminSpreads = spreads || {};
    console.log('[TradeManager] Admin spreads updated');
  }

  initialize(widget) {
    this.widget = widget;
    this.chart = widget.chart(); // Initialize chart reference
    this._attachEvents(widget);
  }

  destroy() {
    if (this.widget && this._handler) {
      this.widget.unsubscribe('drawing_event', this._handler);
    }
    Object.keys(this.lines).forEach(tid => this.removeTradeLines(tid));
  }

  // ─── Support Methods (Sanket v2.0) ──────────────────────────

  // Determine if dragged price should be SL or TP
  _determineLineType(trade, draggedPrice, realEntry) {
    const side = String(trade.side || trade.type || '').toLowerCase();
    const isBuy = side.includes('buy') || side.includes('long');
    
    // For BUY price > entry = TP, for SELL price < entry = TP
    if (isBuy) {
        return draggedPrice > realEntry ? 'tp' : 'sl';
    } else {
        // SELL: price BELOW entry = TP (closing profit), price ABOVE entry = SL (closing loss)
        return draggedPrice < realEntry ? 'tp' : 'sl';
    }
  }

  // Calculate PnL impact for dragged SL/TP price
  _calculateDragPnL(trade, newPrice, lineType) {
    const entry = Number(trade.openPrice || trade.price);
    const quantity = Number(trade.quantity || 1);
    const contractSize = Number(trade.contractSize || 1);
    const side = String(trade.side || trade.type || '').toLowerCase();
    const isBuy = side.includes('buy') || side.includes('long');
    
    let pnl = 0;
    let pnlPercent = 0;
    
    let impactPrice = newPrice;
    
    if (isBuy) {
        pnl = (impactPrice - entry) * quantity * contractSize;
    } else {
        pnl = (entry - impactPrice) * quantity * contractSize;
    }
    
    // Subtract known costs
    pnl = pnl - (trade.commission || 0) - (trade.swap || 0);
    
    // Calculate percentage based on account balance
    const accountBalance = trade.accountBalance || 10000; // Fallback to avoid division by zero
    pnlPercent = (pnl / accountBalance) * 100;
    
    return { pnl, pnlPercent, impactPrice };
  }

  // Cleanup all temporary ghost lines
  _cleanupAllGhosts(tradeId) {
    const tid = String(tradeId);
    if (!this.lines[tid]) return;
    
    const set = this.lines[tid];
    
    if (set.entryGhost) {
        this._destroyShape(set.entryGhost.tvId);
        set.entryGhost = null;
    }
    
    if (set.ghost) {
        this._destroyShape(set.ghost.tvId);
        set.ghost = null;
    }
  }

  _beginDrag(tradeId, type, startPrice) {
    if (this.dragState.active && this.dragState.tradeId !== tradeId) {
        console.warn('[TradeManager] Drag already in progress for different trade');
        return false;
    }
    
    this.dragState.active = true;
    this.dragState.tradeId = tradeId;
    this.dragState.type = type;
    this.dragState.startPrice = startPrice;
    this.activeDragId = tradeId; 
    
    return true;
  }

  _endDrag() {
    if (this.dragState.tradeId) {
        this._cleanupAllGhosts(this.dragState.tradeId);
    }
    this.dragState.active = false;
    this.dragState.tradeId = null;
    this.dragState.type = null;
    this.activeDragId = null;
    this.dragMarkupCache = null; // Clear markup cache
  }

  _isDragActive() {
    return this.dragState.active && !!this.dragState.tradeId;
  }

  _calculateAdaptiveLockDuration() {
    const estimatedWait = Math.min(this.avgResponseTime + 200, 2000);
    return Math.max(estimatedWait, 800); 
  }

  // ─── Events ──────────────────────────────────────────────────

  _attachEvents(widget) {
    this.commitTimers = {};

    this._handler = (id, status) => {
      const tvId = String(id);
      const meta = this.tvIdMap[tvId];
      if (!meta || this.isCommitBlocked) return;

      const action = String(status?.status || status || '').toLowerCase();
      
      // Sanket v2.0 - Only allow interaction on real lines, block preview ghosts
      if (meta.type === 'ghost-sl' || meta.type === 'ghost-tp' || meta.type === 'entry-ghost') {
          return;
      }

      if (action === 'remove' || action === 'deleted') {
          if (meta.tradeId && this.lines[meta.tradeId]?.[meta.type]) {
             console.log(`[TradeManager] Blocked deletion of ${meta.type.toUpperCase()} line`);
             this.lines[meta.tradeId][meta.type] = null;
             setTimeout(() => {
                 this.syncLockUntil = 0;
                 this.syncTrades(this.trades, this.currentSymbol);
             }, 50);
          }
          return;
      }

      if (action === 'started') {
        const shape = widget.chart().getShapeById(tvId);
        const p = shape?.getPoints?.()?.[0]?.price;
        this.dragStartPrice = Number.isFinite(p) ? p : 0;
        
        // Initialize drag state
        this._beginDrag(meta.tradeId, meta.type, this.dragStartPrice);
      }

      if (action === 'points_changed' || action === 'move') {
          if (this._isDragActive()) {
              this._onNativeMove(tvId, meta);
          }

          if (this.commitTimers[tvId]) clearTimeout(this.commitTimers[tvId]);
          this.commitTimers[tvId] = setTimeout(() => {
              this._onNativeStop(tvId, meta);
          }, 50);
      }
    };
    widget.subscribe('drawing_event', this._handler);
  }

  async _onNativeMove(tvId, meta) {
    if (!this._isDragActive()) return;

    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    const price = shape?.getPoints?.()?.[0]?.price;
    if (!price || !Number.isFinite(price) || this.isUpdatingGhost) return;

    this.dragState.currentPrice = price;
    this.dragState.operation = 'updating';

    const trade = this.getTradeById(meta.tradeId);
    if (!trade) return;

    if (!this.dragMarkupCache) {
        this.dragMarkupCache = getAdminMarkupValue(trade.symbol, this._adminSpreads);
    }

    // 🏗️ Phase 34: Crosshair Precision - Check if we can get the actual chart crosshair price
    const crosshairPrice = this.widget?.chart?.().crosshairPrice() || null;
    const effectivePrice = Number(crosshairPrice ?? price);

    const tid = String(meta.tradeId);

    if (meta.type === 'entry') {
        const realEntry = Number(trade.openPrice || trade.price);

        // 🏗️ Phase 33: Stationary Anchor System (Replaces Continuous Snapback)
        if (!this.entryAnchors[tid]) {
            console.log(`[TradeManager] Creating stationary anchor for ${tid}`);
            this.isInternalUpdate = true;
            try {
                const anchorHeight = await this._createShape(tid, 'entry-ghost', realEntry, {
                    color: '#2196F3',
                    style: 3, // Dotted
                    width: 1,
                    text: 'ORIGINAL ENTRY'
                });
                if (anchorHeight) this.entryAnchors[tid] = anchorHeight.tvId;
            } finally {
                this.isInternalUpdate = false;
            }
        }

        const ghostType = this._determineLineType(trade, effectivePrice, realEntry);
        const pnlData = this._calculateDragPnL(trade, effectivePrice, ghostType);
        
        this._updateShape(tvId, effectivePrice, `NEW ${ghostType.toUpperCase()}`, pnlData);

        this.isUpdatingGhost = true;
        try {
            await this._updateSpawnGhost(meta.tradeId, ghostType, effectivePrice);
        } finally {
            this.isUpdatingGhost = false;
        }
    } else if (meta.type === 'sl' || meta.type === 'tp') {
        const pnlData = this._calculateDragPnL(trade, effectivePrice, meta.type);
        const label = `${meta.type.toUpperCase()}: ${pnlData.pnl.toFixed(2)} USD`;
        this._updateShape(tvId, effectivePrice, label, pnlData);
    }
  }

  async _updateSpawnGhost(tradeId, type, price) {
    const tid = String(tradeId);
    if (!this.lines[tid]) return;
    const set = this.lines[tid];

    if (set.ghost && set.ghost.type !== type) {
        this._destroyShape(set.ghost.tvId);
        set.ghost = null;
    }

    const trade = this.getTradeById(tradeId);
    const pnlData = trade ? this._calculateDragPnL(trade, price, type) : null;

    if (!set.ghost) {
        const color = type === 'tp' ? '#4caf50' : '#f44336';
        const ghostId = await this._createShape(tradeId, `ghost-${type}`, price, {
            color,
            style: 2,
            width: 1,
            text: `NEW ${type.toUpperCase()}`
        });
        if (ghostId) {
            set.ghost = { tvId: ghostId.tvId, type, price };
            if (pnlData) this._updateShape(ghostId.tvId, price, null, pnlData);
        }
    } else {
        set.ghost.price = price;
        this._updateShape(set.ghost.tvId, price, null, pnlData);
    }
  }

  async _onNativeStop(tvId, meta) {
    if (!this._isDragActive()) return;

    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    let price = shape?.getPoints?.()?.[0]?.price;
    
    const tid = String(meta.tradeId);
    console.log(`[TradeManager] Drag Stop: ${meta.type} (TV:${tvId}) price=${price}`);

    try {
        if (!price || !meta.tradeId) return;

        // 🏗️ Phase 33: Cleanup Stationary Anchor
        if (this.entryAnchors[tid]) {
            this._destroyShape(this.entryAnchors[tid]);
            delete this.entryAnchors[tid];
        }

        if (meta.type === 'entry') {
            const trade = this.getTradeById(meta.tradeId);
            const ghost = this.lines[tid]?.ghost;

            if (ghost) {
                const entryPrice = Number(trade.openPrice || trade.price);
                const t = this._determineLineType(trade, price, entryPrice);

                this._updateShape(tvId, entryPrice, 'ENTRY');
                console.log(`[TradeManager] Confirming EXACT SPAWN: ${t.toUpperCase()} -> ${price}`);
                await this._commitTrade(tid, t, price);
            } else {
                const realPrice = Number(trade?.openPrice || trade?.price);
                if (realPrice) this._updateShape(tvId, realPrice, 'ENTRY');
            }
        } else if (meta.type === 'sl' || meta.type === 'tp') {
            this._updateShape(tvId, price);
            await this._commitTrade(meta.tradeId, meta.type, price);
        }
    } catch (e) {
        console.error('[TradeManager] Error in drag stop:', e);
    } finally {
        // ALWAYS cleanup ghosts and end drag
        this._endDrag();
        this.dragMarkupCache = null; // Clear cache
    }
  }

  // Sanket v2.0 - validate SL and TP are on correct sides and have minimum spread
  _validateSLTPPrices(trade, newSL, newTP, newEntry) {
    const side = String(trade.side || trade.type || '').toLowerCase();
    const isBuy = side.includes('buy') || side.includes('long');
    const minSpread = 0.00001; 
    
    const errors = [];
    
    if (isBuy) {
        if (newSL && newSL >= newEntry) {
            errors.push(`SL must be below entry for BUY`);
        }
        if (newTP && newTP <= newEntry) {
            errors.push(`TP must be above entry for BUY`);
        }
    } else {
        if (newSL && newSL <= newEntry) {
            errors.push(`SL must be above entry for SELL`);
        }
        if (newTP && newTP >= newEntry) {
            errors.push(`TP must be below entry for SELL`);
        }
    }
    
    if (newSL && newTP) {
        const spread = Math.abs(newTP - newSL);
        if (spread < minSpread) {
            errors.push(`Minimum spread required between SL and TP`);
        }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Sync all trades for the current symbol to the chart.
   * v7.69: Orphan Cleanup always happens, even if interactive lock is active.
   * This ensures drawings disappear instantly when a trade is closed.
   */
  async syncTrades(trades, symbol = null) {
    this.trades = trades || [];
    this.currentSymbol = symbol; 
    const curSym = canonicalSymbol(symbol);
    const visible = this.trades.filter(t => canonicalSymbol(t.symbol) === curSym && !String(t._id || t.id).startsWith('temp_'));
    const visibleIds = new Set(visible.map(t => String(t._id || t.id)));

    if (!this.widget) return;
    const chart = this.widget.chart();

    // 🛡️ v7.69: Orphan Cleanup PRIORITIZATION
    // We MUST remove drawings for trades that are no longer in the list (closed trades),
    // even if the user is currently dragging or in the interaction lock period.
    Object.keys(this.lines).forEach(tid => {
        if (!visibleIds.has(tid)) {
            console.log(`[TradeManager] 🧹 Orphan Cleanup: ${tid}`);
            this.removeTradeLines(tid);
        }
    });

    // Interaction Lock: skip updating positions of ACTIVE trades while user is busy.
    // This prevents "jumpy" lines during manual adjustment.
    if (this.activeDragId) return; 
    if (Date.now() < this.syncLockUntil) return; 

    // Sync positions for visible trades
    for (const trade of visible) {
      await this._syncTradeShapes(chart, trade);
    }
  }

  async _syncTradeShapes(chart, trade) {
    const tid = String(trade._id || trade.id);
    const markup = getAdminMarkupValue(trade.symbol, this._adminSpreads);

    const entry = Number(trade.openPrice || trade.price) - markup;
    const sl = Number(trade.stopLoss || trade.sl) > 0 ? Number(trade.stopLoss || trade.sl) - markup : null;
    const tp = Number(trade.takeProfit || trade.tp) > 0 ? Number(trade.takeProfit || trade.tp) - markup : null;

    if (!Number.isFinite(entry)) return;

    if (!this.lines[tid]) this.lines[tid] = { entry: null, sl: null, tp: null, trade: trade }; // Store trade for optimistic updates
    const set = this.lines[tid];
    set.trade = trade; // Always update with the latest trade object

    if (!set.entry) {
      set.entry = await this._createShape(tid, 'entry', entry, { color: '#2196F3', style: 1, width: 2, text: `ENTRY` });
    } else {
      this._updateShape(set.entry.tvId, entry);
    }

    if (Number.isFinite(sl) && sl > 0) {
      if (!set.sl) {
        set.sl = await this._createShape(tid, 'sl', sl, { color: '#f44336', style: 1, width: 2, text: `SL` });
      } else {
        this._updateShape(set.sl.tvId, sl);
      }
    } else if (set.sl) { this._destroyShape(set.sl.tvId); set.sl = null; }

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
    this.isInternalUpdate = true;
    try {
        const tvId = await chart.createShape(
            { price, time: Math.floor((Date.now() - 60000) / 1000) },
            {
                shape: 'horizontal_line',
                lock: false,
                disableSelection: true,
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
        this.isInternalUpdate = false;
        return { tvId, price };
    } catch (e) { 
        this.isInternalUpdate = false;
        return null; 
    }
  }

  _updateShape(tvId, price, text = null, pnlData = null) {
    const shape = this.widget.chart().getShapeById(tvId);
    if (!shape) return;
    this.isCommitBlocked = true;
    try {
        shape.setPoints([{ price }]);
        
        if (text || pnlData) {
            let label = text || '';
            if (pnlData) {
                const sign = pnlData.pnl >= 0 ? '+' : '';
                const pnlText = `${sign}${pnlData.pnl.toFixed(2)} USD (${pnlData.pnlPercent.toFixed(2)}%)`;
                label = text ? `${text}: ${pnlText}` : pnlText;
            }
            
            shape.setProperties({ 
                overrides: { 
                    text: label,
                    textcolor: pnlData ? (pnlData.pnl >= 0 ? '#4caf50' : '#f44336') : undefined
                } 
            });
        }
    } finally { 
        setTimeout(() => { this.isCommitBlocked = false; }, 50);
    }
  }

  _destroyShape(tvId) {
    this.isInternalUpdate = true;
    try { this.widget.chart().removeEntity(tvId); } catch {}
    delete this.tvIdMap[tvId];
    this.isInternalUpdate = false;
  }

  removeTradeLines(tradeId) {
    const tid = String(tradeId);
    if (!this.lines[tid]) return;
    const set = this.lines[tid];

    if (set.entry) this._destroyShape(set.entry.tvId);
    if (set.sl) this._destroyShape(set.sl.tvId);
    if (set.tp) this._destroyShape(set.tp.tvId);
    if (set.ghost) this._destroyShape(set.ghost.tvId);
    if (set.entryGhost) this._destroyShape(set.entryGhost.tvId);

    delete this.lines[tid];
  }

  getTradeById(tid) {
    return this.trades.find(t => String(t._id || t.id) === tid);
  }

  async _commitTrade(tradeId, type, price) {
    if (!type || type.includes('ghost')) return;
    if (type !== 'sl' && type !== 'tp') return;

    const tid = String(tradeId);
    const t = this.getTradeById(tid);
    if (!t) return;

    const pricescale = this.chart?.symbolExt?.()?.pricescale || 100;
    const decimals = Math.max(0, Math.round(Math.log10(pricescale)));
    const roundedPrice = parseFloat(price.toFixed(decimals));
    
    // Sanket v2.0 - use cached markup or fallback
    const markup = this.dragMarkupCache || getAdminMarkupValue(t.symbol, this._adminSpreads);
    const rawPrice = roundedPrice + markup;

    const entry = Number(t.openPrice || t.price);
    let currentSL = type === 'sl' ? rawPrice : Number(t.stopLoss || t.sl || 0);
    let currentTP = type === 'tp' ? rawPrice : Number(t.takeProfit || t.tp || 0);

    // Sanket v2.0 - validate SL and TP positions
    const validation = this._validateSLTPPrices(t, currentSL, currentTP, entry);
    if (!validation.valid) {
        console.warn(`[TradeManager] ❌ Validation Failed:`, validation.errors);
        // We snap back line visually by syncing trades immediately
        this.syncLockUntil = 0;
        this.syncTrades(this.trades, this.currentSymbol);
        return;
    }

    const payload = { tradeId: tid, sl: currentSL, tp: currentTP };
    const token = getAuthToken();
    if (!token) return;

    const url = `${API_URL}/trade/modify`;
    console.log(`[TradeManager] Committing to: ${url}`, payload);

    const startTime = performance.now();
    this.syncLockUntil = Date.now() + 5000; // Preliminary lock

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const responseTime = performance.now() - startTime;
      this.avgResponseTime = this.avgResponseTime === 0 ? responseTime : (this.avgResponseTime * 0.7) + (responseTime * 0.3);
      
      const newLock = this._calculateAdaptiveLockDuration();
      this.syncLockUntil = Date.now() + newLock;
      
      const data = await res.json();
      
      if (data.success && this.onTradeModify) {
        console.log(`[TradeManager] ✅ Modification SUCCESS`);
        if (this.lines[tid] && this.lines[tid].trade) {
            this.lines[tid].trade.sl = currentSL;
            this.lines[tid].trade.tp = currentTP;
            this.lines[tid].trade.stopLoss = currentSL;
            this.lines[tid].trade.takeProfit = currentTP;
        }
        this.onTradeModify({ tradeId: tid, sl: currentSL, tp: currentTP });
      } else {
        console.warn(`[TradeManager] ❌ Modification FAILED:`, data.message);
        if (window.showToast) window.showToast(data.message || 'Modification failed', 'error');
        this.syncLockUntil = 0;
        this.syncTrades(this.trades, this.currentSymbol);
      }
    } catch (e) {
      console.error('[TradeManager] ❌ Commit execution error:', e);
      this.syncLockUntil = 0;
      this.syncTrades(this.trades, this.currentSymbol);
    }
  }
}
