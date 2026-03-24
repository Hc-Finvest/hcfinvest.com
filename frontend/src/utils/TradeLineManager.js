import { API_URL } from '../config/api';

/**
 * ============================================================
 * TradeLineManager v7.13 — Phase 65: The Pure Canvas Engine
 * ============================================================
 * createOrderLine() was NOT available on this TV license.
 * v7.13 Native Overlay:
 * - Pure Canvas: Draws SL/TP ghosts on an independent <canvas> layer
 * - Zero-Library: Completely bypasses library shapes during interaction
 * - MT5 Styling: Custom dashed drawing (2px Green/Red) with price labels
 * - High-Performance: Hardware-accelerated 60fps interaction
 * ============================================================
 */
// ─── Auth ────────────────────────────────────────────────────
window.TRADE_ENGINE_VERSION = '7.14-SHIELD';
console.log('%c [TradeManager v7.14] HARDWARE SHIELD ACTIVE ', 'background: #222; color: #bada55; font-size: 20px;');

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

    // { tradeId: { entry, handle, ghostSL, ghostTP, sl, tp } }
    this.lines = {};
    this.tvIdMap = {}; // tvId → { tradeId, type }

    // 🧠 v7.0 Authoritative State
    this.tradeStateMap = new Map(); 
    this.dragState = {
      activeTradeId: null,
      isDragging: false,
      ghostType: null, // 'sl' or 'tp'
      currentPrice: null
    };

    this.trades = [];
    this.lastSyncTime = 0;

    // 🛡️ v7.0 Source Control
    this.isUpdatingFromSystem = false;

    // In-flight API guards
    this.modifyInFlight = {};
    this.pendingModify  = {};

    // Debounced commit per tvId
    this._commitFns = {};

    this.isDragging = false;
    this.draggedTradeId = null;

    console.log('[TradeManager v7.13] Pure Canvas Engine Active — Zero-Library interaction');
  }

  initialize(widget) {
    this.widget = widget;
    this._attachEvents(widget);
    this._subscribeToCrosshair(widget);
  }

  // ─── Lifecycle ──────────────────────────────────────────────

  _subscribeToCrosshair(widget) {
    if (!widget) return;
    console.log('[TradeManager] v7.11 DOM Spying Active');
  }

  destroy() {
    if (this.widget && this._handler) {
      try { this.widget.unsubscribe('drawing_event', this._handler); } catch {}
    }
    Object.keys(this.lines).forEach(id => this.removeTradeLines(id));
    this.lines  = {};
    this.tvIdMap = {};
    this.trades = [];
  }

  // ─── Symbol helper ──────────────────────────────────────────

  _symbolMatches(tradeSymbol, chartSymbol) {
    if (!tradeSymbol || !chartSymbol) return false;
    return canonicalSymbol(tradeSymbol) === canonicalSymbol(chartSymbol);
  }

  // ─── Main sync entry ─────────────────────────────────────────

  async syncTrades(actualTrades, symbol = null) {
    // 🛡️ v7.0 GLOBAL FREEZE: Block all updates during active drag
    if (this.dragState.isDragging) return;

    const now = Date.now();
    if (now - this.lastSyncTime < 500) return;
    this.lastSyncTime = now;

    const chart = this.chartRef.current;
    if (!chart) return;

    this.trades = Array.isArray(actualTrades) ? actualTrades : [];

    // Filter to symbol
    const raw = symbol
      ? this.trades.filter(t => this._symbolMatches(t?.symbol, symbol))
      : this.trades;

    const visible = (symbol && raw.length === 0 && this.trades.length > 0) ? this.trades : raw;
    const visibleIds = new Set(visible.map(t => String(t?._id ?? t?.id ?? t?.tradeId ?? '')));

    // Remove stale lines
    Object.keys(this.lines).forEach(id => {
      if (!visibleIds.has(id)) this.removeTradeLines(id);
    });

    // Update Trade Map first (Single Source of Truth)
    visible.forEach(t => {
      const tid = String(t?._id ?? t?.id ?? t?.tradeId ?? '');
      this.tradeStateMap.set(tid, {
        entry: Number(t?.openPrice ?? t?.price),
        sl:    Number(t?.stopLoss ?? t?.sl),
        tp:    Number(t?.takeProfit ?? t?.tp)
      });
    });

    // Create/update visible trade lines
    for (const trade of visible) {
      await this._syncTrade(trade);
    }
  }

  async _syncTrade(trade) {
    const chart = this.chartRef.current;
    if (!chart) return;

    const tradeId = String(trade?._id ?? trade?.id ?? trade?.tradeId ?? '');
    if (!tradeId) return;

    const entryPrice = Number(trade?.openPrice ?? trade?.price);
    const slPrice    = Number(trade?.stopLoss ?? trade?.sl);
    const tpPrice    = Number(trade?.takeProfit ?? trade?.tp);

    if (!Number.isFinite(entryPrice) || entryPrice <= 0) return;

    if (!this.lines[tradeId]) {
      this.lines[tradeId] = { entry: null, handle: null, ghostSL: null, ghostTP: null, sl: null, tp: null };
    }
    const rec = this.lines[tradeId];

    // ── Entry (Visual: locked, blue, solid) ──
    if (!rec.entry) {
      rec.entry = await this._createShape(tradeId, 'entry', entryPrice, {
        color: '#2196F3',
        width: 2,
        style: 0,       // solid
        text: `Entry  ${fmt(entryPrice)}`,
        lock: true,     // 🛡️ Visually locked to prevent jitter
        disableSelection: true,
      });
    } else if (Number(rec.entry.price) !== entryPrice) {
      this._moveShape(rec.entry.tvId, entryPrice);
      rec.entry.price = entryPrice;
      this._setShapeText(rec.entry.tvId, `Entry  ${fmt(entryPrice)}`);
    }

    // ── Handle (Interaction: unlocked, invisible) ──
    if (!rec.handle) {
      rec.handle = await this._createShape(tradeId, 'handle', entryPrice, {
        color: 'rgba(255, 255, 255, 0.02)', // Slightly more opaque for robust tracking
        width: 16, // Even wider hit box
        style: 0,
        text: '',
        lock: false,    // ⚡ Draggable handle
        disableSelection: false,
      });
    } else if (Number(rec.handle.price) !== entryPrice) {
      this._moveShape(rec.handle.tvId, entryPrice);
      rec.handle.price = entryPrice;
    }

    // 🛡️ v7.13 GHOSTS MOVED TO OVERLAY CANVAS
    // (Library shapes no longer used for interaction ghosts)

    // ── SL (draggable, red, dotted) ──
    if (Number.isFinite(slPrice) && slPrice > 0) {
      if (!rec.sl) {
        rec.sl = await this._createShape(tradeId, 'sl', slPrice, {
          color: '#f44336', // Red
          width: 1,
          style: 1,         // Dotted
          text: `SL  ${fmt(slPrice)}`,
          lock: false,
          disableSelection: false,
        });
      } else if (!this.modifyInFlight[tradeId] && Number(rec.sl.price) !== slPrice) {
        this._moveShape(rec.sl.tvId, slPrice);
        rec.sl.price = slPrice;
        this._setShapeText(rec.sl.tvId, `SL  ${fmt(slPrice)}`);
      }
    } else if (rec.sl) {
      this._destroyShape(rec.sl.tvId);
      rec.sl = null;
    }

    // ── TP (draggable, green, dotted) ──
    if (Number.isFinite(tpPrice) && tpPrice > 0) {
      if (!rec.tp) {
        rec.tp = await this._createShape(tradeId, 'tp', tpPrice, {
          color: '#4caf50', // Green
          width: 1,
          style: 1,         // Dotted
          text: `TP  ${fmt(tpPrice)}`,
          lock: false,
          disableSelection: false,
        });
      } else if (!this.modifyInFlight[tradeId] && Number(rec.tp.price) !== tpPrice) {
        this._moveShape(rec.tp.tvId, tpPrice);
        rec.tp.price = tpPrice;
        this._setShapeText(rec.tp.tvId, `TP  ${fmt(tpPrice)}`);
      }
    } else if (rec.tp) {
      this._destroyShape(rec.tp.tvId);
      rec.tp = null;
    }
  }

  // ─── Shape helpers ───────────────────────────────────────────

  async _createShape(tradeId, type, price, cfg) {
    const chart = this.chartRef.current;
    if (!chart?.createShape) return null;

    try {
      const time = Math.floor((Date.now() - 30000) / 1000);
      const tvId = String(await chart.createShape(
        { time, price },
        {
          shape: 'horizontal_line',
          lock: cfg.lock,
          disableSelection: Boolean(cfg.disableSelection),
          disableSave: true,
          disableUndo: true,
          overrides: {
            linecolor:        cfg.color,
            textcolor:        cfg.color,
            linewidth:        cfg.width,
            linestyle:        cfg.style,
            showLabel:        cfg.text ? true : false,
            text:             cfg.text || '',
            horzLabelsAlign:  'right', // MT5 style: Right-aligned in price scale
            vertLabelsAlign:  'top',
          },
        }
      ));

      if (!tvId || tvId === 'null' || tvId === 'undefined') return null;

      this.tvIdMap[tvId] = { tradeId, type };
      return { tvId, price };
    } catch (e) {
      console.error(`[TradeManager] createShape(${type}) error:`, e.message);
      return null;
    }
  }

  _moveShape(tvId, price) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      this.isUpdatingFromSystem = true;
      chart.getShapeById(tvId)?.setPoints?.([{ price }]);
    } catch {}
    finally { this.isUpdatingFromSystem = false; }
  }

  _setShapeText(tvId, text) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      chart.getShapeById(tvId)?.setProperties?.({
        overrides: { 
          text, 
          showLabel: text ? true : false,
          horzLabelsAlign: 'right', 
          vertLabelsAlign: 'top' 
        }
      });
    } catch {}
  }

  _setShapeVisible(tvId, visible) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      chart.getShapeById(tvId)?.setProperties?.({
        overrides: { visible }
      });
    } catch {}
  }

  _setShapeColor(tvId, color) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      chart.getShapeById(tvId)?.setProperties?.({
        overrides: { linecolor: color, textcolor: color }
      });
    } catch {}
  }

  _destroyShape(tvId) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.removeEntity) return;
    try { chart.removeEntity(tvId); } catch {}
    delete this.tvIdMap[tvId];
    delete this._commitFns[tvId];
  }

  removeTradeLines(tradeId) {
    const rec = this.lines[tradeId];
    if (!rec) return;
    if (rec.handle)   this._destroyShape(rec.handle.tvId);
    if (rec.ghostSL)  this._destroyShape(rec.ghostSL.tvId);
    if (rec.ghostTP)  this._destroyShape(rec.ghostTP.tvId);
    if (rec.sl)       this._destroyShape(rec.sl.tvId);
    if (rec.tp)       this._destroyShape(rec.tp.tvId);
    if (rec.entry)    this._destroyShape(rec.entry.tvId);
    delete this.lines[tradeId];
  }

  // ─── Event handling ──────────────────────────────────────────

  _attachEvents(widget) {
    if (!widget) return;

    this._handler = (id, status) => {
      const tvId = String(id || '');
      if (!tvId) return;

      const meta = this.tvIdMap[tvId];
      if (!meta) return;

      // 🛡️ Determine statusKey FIRST
      let statusKey = '';
      if (typeof status === 'string') statusKey = status.toLowerCase();
      else if (status && typeof status === 'object') {
        statusKey = String(status.status || status.state || status.type || status.value || '').toLowerCase();
      }

      console.log(`[TradeManager] Event: ${tvId} (${meta.type}) status=${statusKey}`);

      // 🛡️ v7.0 FIREWALL: Ignore programmatic updates to break loops
      if (this.isUpdatingFromSystem) return;
      if (meta.type === 'entry' || meta.type === 'ghost') return;

      // Handle REDIRECTION
      if (meta.type === 'handle') {
        this._handleEntryDrag(tvId, meta, statusKey);
        return;
      }

      // Update manual drag state
      if (statusKey === 'started' || statusKey === 'move') {
        this.dragState.isDragging = true;
        this.dragState.activeTradeId = meta.tradeId;

        // 🛡️ v7.1 EVENT FALLBACK: Update position if Crosshair Sync failed
        if (statusKey === 'move') {
          const point = chart.getShapeById(tvId)?.getPoints?.()?.[0];
          if (point?.price) {
            this.dragState.currentPrice = Number(point.price);
            this._handleEntryDrag(tvId, meta, 'move'); // Update ghost direction/visibility
            this._updateGhostPosition(meta.tradeId, this.dragState.ghostType, point.price);
          }
        }
      }

      // Commit when user drops
      if (statusKey === 'stopped' || statusKey === 'drag_end' || statusKey === 'finished') {
        this._removeGlassFloor(); // 🛡️ v7.9 Cleanup
        this.dragState.isDragging = false;
        this._scheduleCommit(tvId, meta);
      }
    };

    widget.subscribe('drawing_event', this._handler);
  }

  // ─── v7.9 GLASS-FLOOR ENGINE ────────────────────────────────
  
  _createGlassFloor() {
    if (document.getElementById('tm-interaction-layer')) return;
    
    const container = document.querySelector('iframe[id^="tradingview_"]') || document.querySelector('[class*="chart-container"]');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // 🛡️ v7.13 THE PURE CANVAS OVERLAY
    const canvas = document.createElement('canvas');
    canvas.id = 'tm-interaction-layer';
    canvas.style.position = 'fixed';
    canvas.style.top = `${rect.top}px`;
    canvas.style.left = `${rect.left}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.zIndex = '999999';
    canvas.style.pointerEvents = 'auto'; // Capture the mouse
    canvas.style.cursor = 'ns-resize';
    
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const draw = (y, price) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isTP = this.dragState.ghostType === 'tp';
        const color = isTP ? '#4caf50' : '#f44336';
        
        // 1. Draw Dashed Horizontal Line (MT5 Style)
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        // 2. Draw Price Label
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        const labelText = `PLACE ${this.dragState.ghostType.toUpperCase()} @ ${price.toFixed(2)}`;
        ctx.font = 'bold 12px Arial';
        const metrics = ctx.measureText(labelText);
        const labelW = metrics.width + 16;
        const labelH = 20;
        
        ctx.fillRect(canvas.width - labelW - 50, y - labelH/2, labelW, labelH);
        ctx.fillStyle = '#fff';
        ctx.fillText(labelText, canvas.width - labelW - 42, y + 5);
    };

    canvas.onmousemove = (e) => {
        if (!this.dragState.isDragging) return;
        
        const localY = e.clientY - rect.top;
        const chart = this.widget.activeChart();
        const price = chart.coordinateToPrice(localY);
        
        if (price && Number.isFinite(price)) {
            this.dragState.currentPrice = price;
            draw(localY, price); // Instant 60fps render
        }
    };
    
    canvas.onmouseup = () => {
        this._removeGlassFloor();
    };

    console.log('[TradeManager] Canvas Layer deployed');
  }

  _removeGlassFloor() {
    ['tm-glass-floor', 'tm-css-ghost'].forEach(id => document.getElementById(id)?.remove());
  }

  _updateGhostPosition(tradeId, type, price) {
    // Deprecated for v7.11 in favor of direct DOM ghost movement in _createGlassFloor
  }

  _onDragMove(tvId, meta) {
    const chart = this.chartRef.current;
    if (!chart?.getShapeById) return;
    try {
      const shape = chart.getShapeById(tvId);
      const livePrice = Number(shape?.getPoints?.()?.[0]?.price);
      if (!Number.isFinite(livePrice)) return;
      const label = meta.type === 'sl' ? `SL  ${fmt(livePrice)}` : `TP  ${fmt(livePrice)}`;
      this._setShapeText(tvId, label);
    } catch {}
  }

  _scheduleCommit(tvId, meta) {
    if (!this._commitFns[tvId]) {
      this._commitFns[tvId] = debounce(async () => {
        const chart = this.chartRef.current;
        if (!chart?.getShapeById) return;
        let newPrice;
        try {
          const shape = chart.getShapeById(tvId);
          newPrice = Number(shape?.getPoints?.()?.[0]?.price);
        } catch { return; }
        if (!Number.isFinite(newPrice) || newPrice <= 0) return;
        const { tradeId, type } = meta;
        const rec = this.lines[tradeId];
        if (!rec?.[type]) return;
        rec[type].price = newPrice;
        this._setShapeText(tvId, `${type.toUpperCase()}  ${fmt(newPrice)}`);

        const payload = { tradeId };
        if (type === 'sl') payload.sl = newPrice;
        if (type === 'tp') payload.tp = newPrice;
        console.log(`[TradeManager] Committing ${type.toUpperCase()} = ${newPrice} for trade ${tradeId.slice(-6)}`);
        await this._modifyTrade(payload);
      }, 400);
    }
    this._commitFns[tvId]();
  }

  // ─── v7.0 REAL-TIME ENGINE METHODS ───────────────

  _updateGhostPosition(tradeId, type, price) {
    const rec = this.lines[tradeId];
    if (!rec) return;

    // Determine color and text based on type
    const isTP = type === 'tp';
    const color = isTP ? '#4caf50' : '#f44336'; 
    const label = `PLACE ${type.toUpperCase()}  ${fmt(price)}`; // More aggressive label
    
    // Unified Ghost
    const ghost = rec.ghostSL; 
    if (!ghost) return;

    try {
      this._moveShape(ghost.tvId, price);
      this._setShapeText(ghost.tvId, label);
      this._setShapeColor(ghost.tvId, color);
      this._setShapeVisible(ghost.tvId, true);
    } catch (e) {}
  }

  async _handleEntryDrag(tvId, meta, statusKey) {
    const tradeId = meta.tradeId;
    const rec = this.lines[tradeId];
    if (!rec) return;

    const data = this.tradeStateMap.get(tradeId);
    if (!data) return;

    const isStarting = (statusKey === 'started');
    const isStopping = (statusKey === 'stopped' || statusKey === 'drag_end' || statusKey === 'finished');
    // 🛡️ v7.3 FIX: 'points_changed' is NOT a stop event. Removing it prevents ghosts from vanishing.

    // 1. Initial StartPrice used to determine Ghost Type (SL vs TP)
    if (isStarting) {
      this.dragState.isDragging = true;
      this._createGlassFloor(); // ⚡ v7.9 Deploy overlay instantly
      this.dragState.activeTradeId = tradeId;
      this.dragState.startPrice = data.entry;
      console.log(`[TradeManager] v7.9 Glass-Floor Drag START: ${tradeId.slice(-6)}`);
    }

    // 2. Logic to determine SL vs TP based on side and direction
    if (this.dragState.isDragging) {
      const mousePrice = this.dragState.currentPrice || data.entry;
      const isUp = mousePrice > data.entry;
      const tradeObj = this.getTradeById(tradeId);
      const side = String(tradeObj?.side || tradeObj?.type || '').toLowerCase();
      const isBuy = (side === 'buy' || side === 'long');
      
      this.dragState.ghostType = isBuy ? (isUp ? 'tp' : 'sl') : (isUp ? 'sl' : 'tp');
    }

    // 3. Close the loop on Drop
    if (isStopping && this.dragState.activeTradeId === tradeId) {
      const finalPrice = this.dragState.currentPrice;
      const finalType = this.dragState.ghostType;

      console.log(`[TradeManager] v7.0 Engine Drag STOP: ${finalType} @ ${finalPrice}`);

      // Reset State
      this.dragState.isDragging = false;
      this.dragState.activeTradeId = null;

      // Hide Ghosts (Move to 0)
      if (rec.ghostSL) { this._moveShape(rec.ghostSL.tvId, 0.001); this._setShapeText(rec.ghostSL.tvId, ''); }
      if (rec.ghostTP) { this._moveShape(rec.ghostTP.tvId, 0.001); this._setShapeText(rec.ghostTP.tvId, ''); }

      // Reset handle to entry
      this._moveShape(rec.handle.tvId, data.entry);

      // Commit
      if (finalPrice && Math.abs(finalPrice - data.entry) > (data.entry * 0.0001)) {
        const payload = { tradeId, [finalType]: finalPrice };
        await this._modifyTrade(payload);
      }
    }
  }

  // ─── Backend API ─────────────────────────────────────────────

  async _modifyTrade(payload) {
    const { tradeId } = payload;
    if (!tradeId) return false;
    if (this.modifyInFlight[tradeId]) {
      this.pendingModify[tradeId] = { ...(this.pendingModify[tradeId] || {}), ...payload };
      return true;
    }
    const token = getAuthToken();
    if (!token) return false;
    this.modifyInFlight[tradeId] = true;
    try {
      console.log(`[TradeManager] modifyTrade PAYLOAD:`, payload);
      const res = await fetch(`${API_URL}/trade/modify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[TradeManager] modifyTrade RESPONSE:', data);
      if (data?.success && this.onTradeModify) {
        const update = { tradeId };
        if (payload.sl !== undefined) { update.sl = payload.sl; update.stopLoss = payload.sl; }
        if (payload.tp !== undefined) { update.tp = payload.tp; update.takeProfit = payload.tp; }
        this.onTradeModify(update);
      }
      this.modifyInFlight[tradeId] = false;
      if (this.pendingModify[tradeId]) {
        const next = this.pendingModify[tradeId];
        delete this.pendingModify[tradeId];
        return this._modifyTrade(next);
      }
      return data?.success || false;
    } catch (e) {
      console.error('[TradeManager] modifyTrade error:', e);
      this.modifyInFlight[tradeId] = false;
      return false;
    }
  }

  getTradeById(tradeId) {
    return this.trades.find(t => String(t?._id ?? t?.id ?? t?.tradeId) === tradeId) || null;
  }
}
