import { canonicalSymbol } from './symbolUtils';

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
    this.trades = [];
    this.lastSync = 0;
    this.isCommitBlocked = false;
    this.lastDragPrice = 0; 
    
    // Ghost tracking
    this.activeDragId = null;
    this.dragStartPrice = 0;
    this.isUpdatingGhost = false;
    this.syncLockUntil = 0; 

    console.log('[TradeManager v7.66] Stationary Ghost Engine Active');
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
      
      if (action !== 'points_changed' && action !== 'move' && action !== 'remove') {
          console.log(`[TradeManager] EVENT: ${tvId} (${meta.type}) status="${action}"`);
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
        this.activeDragId = meta.tradeId;
        const shape = widget.chart().getShapeById(tvId);
        const p = shape?.getPoints?.()?.[0]?.price;
        this.dragStartPrice = Number.isFinite(p) ? p : 0;
      }

      if (action === 'points_changed' || action === 'move') {
          if (meta.type === 'entry') this._onNativeMove(tvId, meta);

          if (this.commitTimers[tvId]) clearTimeout(this.commitTimers[tvId]);
          this.commitTimers[tvId] = setTimeout(() => {
              this._onNativeStop(tvId, meta);
          }, 50);
      }
    };
    widget.subscribe('drawing_event', this._handler);
  }

  async _onNativeMove(tvId, meta) {
    const chart = this.widget.chart();
    const shape = chart.getShapeById(tvId);
    const price = shape?.getPoints?.()?.[0]?.price;
    if (!price || !Number.isFinite(price) || this.isUpdatingGhost) return;

    if (meta.type === 'entry') {
        const trade = this.getTradeById(meta.tradeId);
        if (!trade) return;

        const realEntry = Number(trade.openPrice || trade.price);
        const tid = String(meta.tradeId);

        if (!this.lines[tid].entryGhost) {
            const ghostId = await this._createShape(meta.tradeId, `entry-ghost`, realEntry, {
                color: '#2196F3',
                style: 2,
                width: 1,
                text: 'ENTRY'
            });
            if (ghostId) this.lines[tid].entryGhost = { tvId: ghostId.tvId, price: realEntry };
            this._updateShape(tvId, price, 'DRAG TO SET SL/TP');
        }

        const side = String(trade.side || trade.type || '').toLowerCase();
        const isBuy = side.includes('buy') || side.includes('long');
        let ghostType = isBuy ? (price > realEntry ? 'tp' : 'sl') : (price > realEntry ? 'sl' : 'tp');

        this._updateShape(tvId, price, `NEW ${ghostType.toUpperCase()}`);

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

    if (set.ghost && set.ghost.type !== type) {
        this._destroyShape(set.ghost.tvId);
        set.ghost = null;
    }

    if (!set.ghost) {
        const color = type === 'tp' ? '#4caf50' : '#f44336';
        const ghostId = await this._createShape(tradeId, `ghost-${type}`, price, {
            color,
            style: 2,
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
    let price = shape?.getPoints?.()?.[0]?.price;
    
    const tid = String(meta.tradeId);
    console.log(`[TradeManager] Drag Stop: ${meta.type} (TV:${tvId}) price=${price}`);

    if (!price || !meta.tradeId) {
        this.activeDragId = null;
        return;
    }

    // 🛡️ v7.67 BUG BASH: Ignore ghost interaction
    if (meta.type.includes('ghost')) {
        this.activeDragId = null;
        return;
    }

    if (meta.type === 'entry') {
      const trade = this.getTradeById(meta.tradeId);
      
      if (this.lines[tid]?.entryGhost) {
          this._destroyShape(this.lines[tid].entryGhost.tvId);
          delete this.lines[tid].entryGhost;
      }
      
      const ghost = this.lines[tid]?.ghost;
      if (ghost) {
          this._destroyShape(ghost.tvId);
          this.lines[tid].ghost = null;
          
          const side = String(trade.side || trade.type || '').toLowerCase();
          const isBuy = side.includes('buy') || side.includes('long');
          const entryPrice = Number(trade.openPrice || trade.price);
          const t = isBuy ? (price > entryPrice ? 'tp' : 'sl') : (price < entryPrice ? 'tp' : 'sl');

          this._updateShape(tvId, entryPrice, 'ENTRY');
          console.log(`[TradeManager] Confirming EXACT SPAWN: ${t.toUpperCase()} -> ${price}`);
          await this._commitTrade(tid, t, price);
      } else {
          const realPrice = Number(trade?.openPrice || trade?.price);
          if (realPrice) this._updateShape(tvId, realPrice, 'ENTRY');
      }
      
      setTimeout(() => { this.activeDragId = null; }, 100); 
    } else {
        this._updateShape(tvId, price);
        await this._commitTrade(meta.tradeId, meta.type, price);
        setTimeout(() => { this.activeDragId = null; }, 200);
    }
  }

  async syncTrades(trades, symbol = null) {
    if (this.activeDragId) return; 
    if (Date.now() < this.syncLockUntil) return; 

    this.trades = trades || [];
    this.currentSymbol = symbol; 
    const curSym = canonicalSymbol(symbol);
    const visible = this.trades.filter(t => canonicalSymbol(t.symbol) === curSym && !String(t._id || t.id).startsWith('temp_'));
    const visibleIds = new Set(visible.map(t => String(t._id || t.id)));

    if (!this.widget) return;
    const chart = this.widget.chart();

    Object.keys(this.lines).forEach(tid => {
        if (!visibleIds.has(tid)) {
            this.removeTradeLines(tid);
        }
    });

    for (const trade of visible) {
      await this._syncTradeShapes(chart, trade);
    }
  }

  async _syncTradeShapes(chart, trade) {
    const tid = String(trade._id || trade.id);
    const entry = Number(trade.openPrice || trade.price);
    const sl = Number(trade.stopLoss || trade.sl);
    const tp = Number(trade.takeProfit || trade.tp);

    if (!Number.isFinite(entry)) return;

    if (!this.lines[tid]) this.lines[tid] = { entry: null, sl: null, tp: null };
    const set = this.lines[tid];

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
    if (set.entryGhost) this._destroyShape(set.entryGhost.tvId);

    delete this.lines[tid];
  }

  getTradeById(tid) {
    return this.trades.find(t => String(t._id || t.id) === tid);
  }

  async _commitTrade(tradeId, type, price) {
    // 🛡️ v7.67 BUG BASH: Explicitly block ghost commits
    if (!type || type.includes('ghost')) return;
    if (type !== 'sl' && type !== 'tp') return;

    const tid = String(tradeId);
    const trade = this.getTradeById(tid);
    if (!trade) return;

    let decimals = 5;
    try {
        const info = this.widget.activeChart().symbolInfo();
        if (info && info.pricescale) {
            decimals = Math.round(Math.log10(info.pricescale));
            if (decimals < 0) decimals = 2;
        }
    } catch {}

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

    const payload = { tradeId: tid, sl: currentSL, tp: currentTP };
    const token = getAuthToken();
    if (!token) return;

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
