import { API_URL } from '../config/api';

const DEBUG_TRADE_LINES = true; // 🏁 Diagnostics Activated for Phase 32

const normalizeAuthToken = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let token = raw.trim();
  if (!token || token === 'undefined' || token === 'null') return '';
  if (token.startsWith('Bearer ')) token = token.slice(7).trim();
  return token;
};

const getAuthToken = () => {
  const direct = normalizeAuthToken(localStorage.getItem('token'));
  if (direct) return direct;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return normalizeAuthToken(user?.token || user?.accessToken || user?.jwt);
  } catch (e) {
    return '';
  }
};

export class TradeLineManager {
  constructor(chartRef, onTradeModify) {
    this.chartRef = chartRef;
    this.onTradeModify = onTradeModify;

    this.widget = null;
    this.trades = [];

    this.lines = {}; // { tradeId: { entry, sl, tp } }
    this.tvIdToTradeId = {};
    this.tvIdToType = {}; // 'entry' | 'sl' | 'tp'
    this.lastCommittedByTvId = {};
    this.draggingTvId = null; // 🛡️ Safety: track which line is being dragged
    this.syncLockTimes = {}; // 🛡️ Safety: { tvId: lastDropTime } to prevent snapback
    this.lastSyncTime = 0; // 🛡️ Safety: used for throttling
    this.inflightLines = new Set(); // 🛡️ Safety: tracking active createLine calls
    this.modifyDebounceTimers = {}; // { tvId: timeoutId }
    this.modifyInFlight = {}; // { tradeId: bool }
    this.pendingModification = {}; // { tradeId: payload }
    this._drawingEventHandler = null;
    this.isInternalUpdate = false; // 🛡️ Safety: Recursion guard
  }

  //Sanket v2.0 - Small debug logger (off by default) for quick runtime checks.
  _log(...args) {
    if (!DEBUG_TRADE_LINES) return;
    console.log('[TradeLineManager]', ...args);
  }

  _canonicalSymbol(raw) {
    const v = String(raw || '').trim().toUpperCase();
    if (!v) return '';

    //Sanket v2.0 - Normalize symbols like XAU/USD, XAUUSDm, and XAUUSD.pro to a stable compare key.
    const compact = v.replace(/[^A-Z0-9]/g, '');
    if (!compact) return '';
    if (/^[A-Z]{6}[A-Z]$/.test(compact)) return compact.slice(0, 6);
    if (/^[A-Z]{6}/.test(compact)) return compact.slice(0, 6);
    return compact;
  }

  _symbolMatches(a, b) {
    return this._canonicalSymbol(a) === this._canonicalSymbol(b);
  }

  initialize(widget) {
    this.widget = widget;
    this.attachEventListeners(widget);
  }

  destroy() {
    if (this.widget?.unsubscribe && this._drawingEventHandler) {
      try {
        this.widget.unsubscribe('drawing_event', this._drawingEventHandler);
      } catch (e) {}
    }
    this._drawingEventHandler = null;

    Object.keys(this.lines).forEach((tradeId) => this.removeTradeLines(tradeId));
    this.lines = {};
    this.tvIdToTradeId = {};
    this.tvIdToType = {};
    this.lastCommittedByTvId = {};
    this.widget = null;
    this.trades = [];
  }

  //Sanket v2.0 - Accept TradingView drag-stop status in both string and object payload variants.
  _isStopStatus(status) {
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      return s === 'stopped' || s === 'finished' || s === 'drag_end' || s === 'points_changed';
    }

    if (status && typeof status === 'object') {
      if (status.isFinished === true || status.stopped === true) return true;
      const val = (status.status || status.state || status.type || status.value || '');
      const s = String(val).toLowerCase();
      return s === 'stopped' || s === 'finished' || s === 'drag_end' || s === 'points_changed';
    }

    return false;
  }

  async syncTrades(actualTrades, symbol = null) {
    // 🛡️ Throttling Protection: don't sync more than once per 500ms
    const now = Date.now();
    if (now - this.lastSyncTime < 500) return;
    this.lastSyncTime = now;

    this.trades = Array.isArray(actualTrades) ? actualTrades : [];

    const symbolFilteredTrades = symbol
      ? this.trades.filter((t) => this._symbolMatches(t?.symbol, symbol))
      : this.trades;

    //Sanket v2.0 - If symbol normalization still fails for some broker format, prefer rendering trades over empty chart lines.
    const filteredTrades = symbol && symbolFilteredTrades.length === 0 && this.trades.length > 0
      ? this.trades
      : symbolFilteredTrades;

    const activeIds = new Set(
      filteredTrades.map((t) => String(t?._id ?? t?.id ?? t?.tradeId ?? ''))
    );

    Object.keys(this.lines).forEach((tradeId) => {
      if (!activeIds.has(tradeId)) this.removeTradeLines(tradeId);
    });

    for (const trade of filteredTrades) {
      await this.syncTrade(trade);
    }
  }

  //Sanket v2.0 - Create/update three independent lines only: entry (display), sl (drag), tp (drag).
  async syncTrade(trade) {
    const tradeId = String(trade?._id ?? trade?.id ?? trade?.tradeId ?? '');
    if (!tradeId) return;

    const entryPrice = Number(trade?.openPrice ?? trade?.price);
    const slPrice = trade?.stopLoss ?? trade?.sl;
    const tpPrice = trade?.takeProfit ?? trade?.tp;

    if (!Number.isFinite(entryPrice) || entryPrice <= 0) return;

    if (!this.lines[tradeId]) {
      this.lines[tradeId] = { entry: null, sl: null, tp: null };
    }

    if (this.lines[tradeId]?.entry?.tvId === (this.draggingTvId)) {
        this._log('syncTrade: skipping entry recreation due to active drag', tradeId);
    } else {
        await this.createEntryLine(trade);
    }

    const now = Date.now();
    const isSlLocked = this.lines[tradeId]?.sl?.tvId && (now - (this.syncLockTimes[this.lines[tradeId].sl.tvId] || 0) < 3000);
    const isTpLocked = this.lines[tradeId]?.tp?.tvId && (now - (this.syncLockTimes[this.lines[tradeId].tp.tvId] || 0) < 3000);

    if (Number.isFinite(Number(slPrice)) && Number(slPrice) > 0) {
      if (isSlLocked) {
        this._log('syncTrade: SL is sync-locked (ignoring stale backend data)', tradeId);
      } else {
        await this.createSLLine(trade);
      }
    } else if (this.lines[tradeId].sl && !isSlLocked) {
      this.destroyShape(this.lines[tradeId].sl.tvId);
      this.lines[tradeId].sl = null;
    }

    if (Number.isFinite(Number(tpPrice)) && Number(tpPrice) > 0) {
      if (isTpLocked) {
        this._log('syncTrade: TP is sync-locked (ignoring stale backend data)', tradeId);
      } else {
        await this.createTPLine(trade);
      }
    } else if (this.lines[tradeId].tp && !isTpLocked) {
      this.destroyShape(this.lines[tradeId].tp.tvId);
      this.lines[tradeId].tp = null;
    }
  }

  async createEntryLine(trade) {
    const tradeId = String(trade?._id ?? trade?.id ?? trade?.tradeId ?? '');
    const price = Number(trade?.openPrice ?? trade?.price);
    const line = this.lines[tradeId]?.entry;

    if (line) {
      if (line.tvId === this.draggingTvId) return; // Don't destroy while dragging

      // ✅ CHURN PROTECT: If price is identical, ignore the update entirely
      if (Number(line.price) === price) {
        this._log('createEntryLine: price identical, skipping update', tradeId);
        return;
      }

      this.destroyShape(line.tvId);
      this.lines[tradeId].entry = null;
    }
    try {
      // ✅ Smart Precision Label for Entry
      const entryLabel = `Entry: ${price.toFixed(price > 100 ? 2 : 5)}`;

      const shape = await this.createLine(tradeId, 'entry', price, {
        color: '#2196F3',
        lock: false,
        disableSelection: false,
        width: 2,
        style: 2,
        text: entryLabel
      });
      if (shape) {
        this.lines[tradeId].entry = shape;
      }
      this._log('createEntryLine done', tradeId, price, shape?.tvId || 'failed');
    } catch (e) {
      this._log('createEntryLine error', tradeId, e);
    }
  }

  //Sanket v2.0 - Hard-enforce entry as display-only even if TradingView ignores create-time flags.
  enforceEntryReadOnly(tvId) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      const shape = chart.getShapeById(tvId);
      shape?.setProperties?.({
        lock: true,
        disableSelection: true,
      });
      shape?.setSelectionEnabled?.(false);
      shape?.setEditable?.(false);
    } catch (e) {}
  }

  async createSLLine(trade) {
    const tradeId = String(trade?._id ?? trade?.id ?? trade?.tradeId ?? '');
    const price = Number(trade?.stopLoss ?? trade?.sl);
    if (!Number.isFinite(price) || price <= 0) return null;

    const label = `SL: ${price.toFixed(price > 100 ? 2 : 5)}`;

    const creationKey = `sl:${tradeId}`;
    if (this.inflightLines.has(creationKey)) return this.lines[tradeId]?.sl;

    const line = this.lines[tradeId]?.sl;
    if (line) {
      // ✅ CHURN PROTECT: Skip move if price and text are identical
      if (Number(line.price) === price && line.lastLabel === label) {
        return line;
      }
      this.moveShape(line.tvId, price);
      this.updateShapeLabel(line.tvId, label);
      line.price = price;
      line.lastLabel = label;
      return line;
    }

    this.inflightLines.add(creationKey);
    try {
      const shape = await this.createLine(tradeId, 'sl', price, {
        color: '#F44336',
        lock: false,
        disableSelection: false,
        width: 1,
        style: 2,
        text: label
      });
      if (shape) {
        shape.lastLabel = label;
        this.lines[tradeId].sl = shape;
      }
      this.inflightLines.delete(creationKey);
      this._log('createSLLine done', tradeId, price, shape?.tvId || 'failed');
      return shape;
    } catch (e) {
      this.inflightLines.delete(creationKey);
      return null;
    }
  }

  async createTPLine(trade) {
    const tradeId = String(trade?._id ?? trade?.id ?? trade?.tradeId ?? '');
    const price = Number(trade?.takeProfit ?? trade?.tp);
    if (!Number.isFinite(price) || price <= 0) return null;

    const label = `TP: ${price.toFixed(price > 100 ? 2 : 5)}`;

    const creationKey = `tp:${tradeId}`;
    if (this.inflightLines.has(creationKey)) return this.lines[tradeId]?.tp;

    const line = this.lines[tradeId]?.tp;
    if (line) {
      // ✅ CHURN PROTECT: Skip move if price and text are identical
      if (Number(line.price) === price && line.lastLabel === label) {
        return line;
      }
      this.moveShape(line.tvId, price);
      this.updateShapeLabel(line.tvId, label);
      line.price = price;
      line.lastLabel = label;
      return line;
    }

    this.inflightLines.add(creationKey);
    try {
      const shape = await this.createLine(tradeId, 'tp', price, {
        color: '#4CAF50',
        lock: false,
        disableSelection: false,
        width: 1,
        style: 2,
        text: label
      });
      if (shape) {
        shape.lastLabel = label;
        this.lines[tradeId].tp = shape;
      }
      this.inflightLines.delete(creationKey);
      this._log('createTPLine done', tradeId, price, shape?.tvId || 'failed');
      return shape;
    } catch (e) {
      this.inflightLines.delete(creationKey);
      return null;
    }
  }

  updateShapeLabel(tvId, text) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      const shape = chart.getShapeById(tvId);
      shape?.setProperties?.({
        overrides: { 
          text,
          horzLabelsAlign: 'left',
          vertLabelsAlign: 'top'
        }
      });
    } catch (e) {}
  }

  async createLine(tradeId, type, price, config) {
    const chart = this.chartRef.current;
    if (!chart?.createShape) return null;

    try {
      // 🛡️ Safety: use a slightly older time (30s ago) to ensure it's within TradingView's loaded range
      const time = Math.floor((Date.now() - 30000) / 1000);
      
      // ✅ Phase 31: Reverting to 'horizontal_line' for full-width visibility.
      // We previously tried rays, but the user prefers the global line.
      const shapeType = 'horizontal_line';

      const tvId = String(await chart.createShape(
        { time, price },
        {
          shape: shapeType,
          lock: config.lock,
          disableSelection: Boolean(config.disableSelection),
          disableSave: true,
          disableUndo: true,
          overrides: {
            linecolor: config.color,
            textcolor: config.color,
            linewidth: config.width,
            linestyle: config.style,
            showLabel: true,
            text: config.text || '',
            horzLabelsAlign: 'left',
            vertLabelsAlign: 'top',
          },
        }
      ));

      if (!tvId || tvId === 'null' || tvId === 'undefined') return null;

      this.tvIdToTradeId[tvId] = tradeId;
      this.tvIdToType[tvId] = type;
      return { tvId, price };
    } catch (e) {
      this._log('createLine: CRITICAL ERROR', e);
      return null;
    }
  }

  moveShape(tvId, price) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.getShapeById) return;
    try {
      const shape = chart.getShapeById(tvId);
      shape?.setPoints?.([{ price }]);
    } catch (e) {}
  }

  destroyShape(tvId) {
    const chart = this.chartRef.current;
    if (!tvId || !chart?.removeEntity) return;
    try {
      chart.removeEntity(tvId);
    } catch (e) {}
    delete this.tvIdToTradeId[tvId];
    delete this.tvIdToType[tvId];
  }

  removeTradeLines(tradeId) {
    const rec = this.lines[tradeId];
    if (!rec) return;
    if (rec.entry) this.destroyShape(rec.entry.tvId);
    if (rec.sl) this.destroyShape(rec.sl.tvId);
    if (rec.tp) this.destroyShape(rec.tp.tvId);
    delete this.lines[tradeId];
  }

  getTradeById(tradeId) {
    return this.trades.find((t) => String(t?._id ?? t?.id ?? t?.tradeId) === tradeId) || null;
  }

  async handleSLDrag(tvId) {
    const tradeId = this.tvIdToTradeId[tvId];
    if (!tradeId) return;

    const chart = this.chartRef.current;
    let shape = null;
    try {
      shape = chart?.getShapeById?.(tvId);
    } catch (e) {
      return;
    }
    const points = shape?.getPoints?.();
    const sl = Number(points?.[0]?.price);
    if (!Number.isFinite(sl) || sl <= 0) return;

    const priceKey = Number(sl.toFixed(6));
    if (this.lastCommittedByTvId[tvId] === priceKey) return;

    // --- DEBOUNCE LOGIC ---
    // Cancel the previous timer if the user is still dragging
    if (this.modifyDebounceTimers[tvId]) {
      clearTimeout(this.modifyDebounceTimers[tvId]);
    }

    // Wait 500ms after the last movement before hitting the API
    this.modifyDebounceTimers[tvId] = setTimeout(async () => {
      this._log('handleSLDrag executing', tradeId, sl);

      const ok = await this.modifyTrade({ tradeId, sl });
      if (ok) this.lastCommittedByTvId[tvId] = priceKey;
    }, 500);
  }

  async handleTPDrag(tvId) {
    const tradeId = this.tvIdToTradeId[tvId];
    if (!tradeId) return;

    const chart = this.chartRef.current;
    let shape = null;
    try {
      shape = chart?.getShapeById?.(tvId);
    } catch (e) {
      return;
    }
    const points = shape?.getPoints?.();
    const tp = Number(points?.[0]?.price);
    if (!Number.isFinite(tp) || tp <= 0) return;

    const priceKey = Number(tp.toFixed(6));
    if (this.lastCommittedByTvId[tvId] === priceKey) return;

    // --- DEBOUNCE LOGIC ---
    if (this.modifyDebounceTimers[tvId]) {
      clearTimeout(this.modifyDebounceTimers[tvId]);
    }

    this.modifyDebounceTimers[tvId] = setTimeout(async () => {
      this._log('handleTPDrag executing', tradeId, tp);

      const ok = await this.modifyTrade({ tradeId, tp });
      if (ok) this.lastCommittedByTvId[tvId] = priceKey;
    }, 500);
  }

  //Sanket v2.0 - Send only one field (sl or tp) based on dragged line type.
  //🛡️ Modification: Use a semaphore and batching to avoid 429 and race conditions.
  async modifyTrade(payload) {
    const tradeId = payload.tradeId;
    if (!tradeId) return false;

    // If a request is already in flight for this trade, queue this payload and return
    if (this.modifyInFlight[tradeId]) {
      this.pendingModification[tradeId] = {
        ...(this.pendingModification[tradeId] || {}),
        ...payload
      };
      this._log('modifyTrade: request in flight, queuing payload', tradeId);
      return true;
    }

    const token = getAuthToken();
    if (!token) return false;

    this.modifyInFlight[tradeId] = true;
    try {
      const res = await fetch(`${API_URL}/trade/modify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      this._log('modifyTrade response', payload, data?.success);
      
      if (data?.success && this.onTradeModify) {
        const update = { tradeId };
        if (payload.sl !== undefined) { update.sl = payload.sl; update.stopLoss = payload.sl; }
        if (payload.tp !== undefined) { update.tp = payload.tp; update.takeProfit = payload.tp; }
        this.onTradeModify(update);
      }

      this.modifyInFlight[tradeId] = false;

      // Check if another request was queued while this one was running
      if (this.pendingModification[tradeId]) {
        const nextPayload = this.pendingModification[tradeId];
        delete this.pendingModification[tradeId];
        this._log('modifyTrade: executing pending request', tradeId);
        return this.modifyTrade(nextPayload);
      }

      return data?.success || false;
    } catch (e) {
      this.modifyInFlight[tradeId] = false;
      return false;
    }
  }

  async handleEntryDrag(tvId, status) {
    const tradeId = this.tvIdToTradeId[tvId];
    if (!tradeId) return;

    const trade = this.getTradeById(tradeId);
    if (!trade) return;

    const chart = this.chartRef.current;
    let shape = null;
    try {
      shape = chart?.getShapeById?.(tvId);
    } catch (e) {
      this._log('handleEntryDrag: shape not found');
      return;
    }
    if (!shape) return;

    const entryPrice = Number(trade?.openPrice ?? trade?.price);

    // ✅ Phase 32: HEAVY DIAGNOSTICS
    const statusPoints = status && typeof status === 'object' ? status.points : null;
    const shapePoints = shape.getPoints?.() || null;
    
    // Stringify status keys for easier reading in console
    const statusKeys = status && typeof status === 'object' ? Object.keys(status).join(',') : 'n/a';

    this._log('handleEntryDrag DIAGNOSTICS:', {
      tvId,
      statusKey,
      statusKeys,
      statusPoint0: statusPoints?.[0]?.price,
      shapePoint0: shapePoints?.[0]?.price,
      entryPrice
    });

    const mousePrice = Number(statusPoints?.[0]?.price ?? shapePoints?.[0]?.price);
    const isFinished = this._isStopStatus(status);

    // 🛡️ Guard: Precision-aware price comparison to avoid infinite setPoints loops
    const isAtEntry = Math.abs(mousePrice - entryPrice) < 0.0000001;

    // ✅ Phase 31: Continuous Snapback
    // Always keep the entry line fixed at its execution price during EVERY move event.
    // This makes the entry line appear stationary while the new SL/TP follows the cursor.
    if (!isAtEntry) {
      this._log('handleEntryDrag: snapping back to entry', entryPrice);
      try {
        this.isInternalUpdate = true;
        shape.setPoints([{ price: entryPrice }]);
        this.isInternalUpdate = false;
      } catch (e) {
        this._error('handleEntryDrag: snapback failed', e);
        this.isInternalUpdate = false;
      }
    }
 
    // 🛡️ Guard: No need to process further if we're already at entry 
    // This happens because we just triggered a snapback or the cursor hasn't moved yet.
    if (isAtEntry) {
      return;
    }

    const isBuy = String(trade.side || trade.type || '').toLowerCase() === 'buy';
    const isUp = mousePrice > entryPrice;

    // MT5 Logic:
    // BUY: Up -> TP, Down -> SL
    // SELL: Up -> SL, Down -> TP
    const targetType = isBuy ? (isUp ? 'tp' : 'sl') : (isUp ? 'sl' : 'tp');
    this._log('handleEntryDrag', { tradeId, isUp, targetType });

    // 🛡️ Distance Guard: If too close to entry, ignore (prevents merging)
    const priceDiff = Math.abs(mousePrice - entryPrice);
    const minDiff = entryPrice * 0.0001; // roughly 1 pip
    if (isFinished && priceDiff < minDiff) {
      this._log('handleEntryDrag: too close to entry, ignoring drop', tradeId);
      return;
    }

    // Ensure the target line exists and move it to the mouse position
    if (targetType === 'sl') {
      const updatedTrade = { ...trade, stopLoss: mousePrice, sl: mousePrice };
      const slShape = await this.createSLLine(updatedTrade);
      if (isFinished && slShape?.tvId) {
        this._log('handleEntryDrag: finished drag for SL', tradeId);
        await this.handleSLDrag(slShape.tvId);
      }
    } else {
      const updatedTrade = { ...trade, takeProfit: mousePrice, tp: mousePrice };
      const tpShape = await this.createTPLine(updatedTrade);
      if (isFinished && tpShape?.tvId) {
        this._log('handleEntryDrag: finished drag for TP', tradeId);
        await this.handleTPDrag(tpShape.tvId);
      }
    }
  }

  attachEventListeners(widget) {
    if (!widget) return;

    this._drawingEventHandler = async (id, status) => {
      // 🛡️ Phase 31: Recursion Guard
      if (this.isInternalUpdate) return;

      const tvId = String(id || '');
      if (!tvId) return;

      const type = this.tvIdToType[tvId];
      
      // 🛡️ Robust Status Extraction
      let rawStatus = '';
      if (typeof status === 'string') rawStatus = status;
      else if (status && typeof status === 'object') {
        rawStatus = (status.status || status.state || status.type || status.value || 'points_changed');
      }
      const statusKey = String(rawStatus).toLowerCase();
      const statusKeys = status && typeof status === 'object' ? Object.keys(status).join(',') : 'n/a';
      
      this._log('drawing_event raw data:', { tvId, type, statusKey, statusKeys });

      // 🛡️ Skip processing for 'remove' events to avoid recursion and errors
      if (statusKey === 'remove') {
        this._log('drawing_event: skipping removed shape', tvId);
        return;
      }

      // Track active drag for safety in syncTrade
      // statusKey could be 'points_changed', 'move', 'started', 'stopped', etc.
      if (statusKey === 'move' || statusKey === 'started' || statusKey === 'points_changed') {
        this.draggingTvId = tvId;
      } else if (this._isStopStatus(status)) {
        // Only release draggingTvId if it's a "terminal" stop status
        // Note: some TV versions use 'points_changed' for the final drop too.
        // We rely on handleSLDrag debounce for the API, but keep the lock until we are 100% sure.
        if (statusKey !== 'points_changed') {
           this.draggingTvId = null;
        }
        this.syncLockTimes[tvId] = Date.now();
        this._log('drawing_event: drop-ish detected, sync locked for 3s', tvId);
      }

      if (type === 'entry') {
        // ✅ Phase 30: Pass the full status object to handleEntryDrag.
        // This allows reading 'live' points from the cursor event if shape.getPoints() is lagged.
        await this.handleEntryDrag(tvId, status);
      } else if (this._isStopStatus(status)) {
        // Standard SL/TP dragging
        if (type === 'sl') {
          await this.handleSLDrag(tvId);
        } else if (type === 'tp') {
          await this.handleTPDrag(tvId);
        }
      }
    };

    widget.subscribe('drawing_event', this._drawingEventHandler);
  }
}
