import { useEffect, useRef } from "react";
import Datafeed, { getMetaApiPriceEvents } from "../services/datafeed.js";
import { API_URL } from "../config/api";

/**
 * Enhanced logging for drag-to-modify workflow
 */
const dragLogger = {
  log: (stage, msg) => console.log(`%c[DRAG-${stage}]%c ${msg}`, 'color: #FF6B9D; font-weight: bold', 'color: inherit'),
  event: (eventType, data) => console.log(`%c[DRAG-EVENT]%c ${eventType}`, 'color: #FFD700; font-weight: bold', data || ''),
  error: (msg) => console.error(`%c[DRAG-ERROR]%c ${msg}`, 'color: #FF5252; font-weight: bold', 'color: inherit'),
  success: (msg) => console.log(`%c[DRAG-SUCCESS]%c ${msg}`, 'color: #52C41A; font-weight: bold', 'color: inherit'),
  timing: (label, fn) => {
    const start = performance.now();
    const result = fn();
    const duration = (performance.now() - start).toFixed(2);
    console.log(`%c[DRAG-TIMING]%c ${label} took ${duration}ms`, 'color: #1890FF; font-weight: bold', 'color: inherit');
    return result;
  }
};

/**
 * Production-Grade Trading Chart Component
 * Manages trade visualization using TradingView Charting Library
 * Features: Order lines, draggable risk markers, live P/L tracking
 */
const Advance_Trading_View_Chart = ({ symbol = "XAUUSD", trades = [], onTradeModify }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const chartRef = useRef(null);
  const shapesRef = useRef({}); // { tradeId: { entry: {id, obj}, sl: {id, obj}, tp: {id, obj} } }
  const onTradeModifyRef = useRef(onTradeModify);
  const currentPriceRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const activeDragsRef = useRef({});
  const canvasRef = useRef(null); // Canvas overlay for price lines
  const overlayRef = useRef(null); // Overlay HTML container
  const priceLinesRef = useRef({}); // Store price line data for canvas rendering
  const lineToTradeMapRef = useRef({}); // Maps lineId -> { tradeId, levelType: 'sl'|'tp'|'entry' }
  const pendingModifyRef = useRef({}); // { tradeId: { newSL, newTP } } for batch updates
  const previousPricesRef = useRef({}); // For polling-based drag detection
  const shapeObjRef = useRef({}); // Direct refs: { lineId: shapeObject } - solves Promise string IDs
  const modifyTimeoutRef = useRef(0); // Timestamp of last modification to prevent duplicate updates
  const shapeToTradeMapRef = useRef(new Map()); // Map shape objects to { tradeId, levelType } for event detection
  const lastTradesRef = useRef(null); // Track last trades to detect actual changes
  const lastSymbolRef = useRef(null); // Track last symbol to detect symbol changes
  const tvShapeIdToLineIdRef = useRef({}); // Maps TradingView shape IDs to our lineIds
  const shapesByObjectRef = useRef(new Map()); // Maps shape objects directly to lineIds for lookup
  const pollIntervalRef = useRef(null); // //Sanket - "Stored so clearInterval can be called on unmount to prevent timer leak"

  useEffect(() => {
    onTradeModifyRef.current = onTradeModify;
  }, [onTradeModify]);

  /**
   * Modifies trade SL/TP via API
   */
  const modifyTradeLevel = async (tradeId, newSL, newTP) => {
    try {
      const response = await fetch(`${API_URL}/trade/modify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tradeId, 
          sl: parseFloat(newSL), 
          tp: parseFloat(newTP) 
        })
      });

      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = await response.json();
      
      if (data.success && onTradeModifyRef.current) {
        onTradeModifyRef.current();
      }
    } catch (err) {
      console.error(`[Trading] Modify failed for ${tradeId}:`, err);
    }
  };

  /**
   * Creates horizontal line using available chart APIs
   * Returns { id, obj } to track line for drag events
   */
  const createOrderLineAtPrice = async (price, label, color, lineStyle, tradeId, levelType) => {
    dragLogger.log('CREATE', `${levelType}: price=${price}, tradeId=${tradeId}`);
    
    if (!chartRef.current) {
      dragLogger.error('Chart not ready');
      return null;
    }

    const lineId = `${tradeId}-${levelType}-${Date.now()}`;
    dragLogger.log('CREATE', `Generated lineId: ${lineId}`);

    try {
      // Method 1: Native createOrderLine (Trading Platform)
      if (chartRef.current.createOrderLine && typeof chartRef.current.createOrderLine === 'function') {
        try {
          const orderLine = chartRef.current.createOrderLine();
          orderLine.setPrice(price);
          orderLine.setText(label);
          orderLine.setLineColor(color);
          orderLine.setLineWidth(2);
          orderLine.setLineStyle(lineStyle);

          // Make orderLine draggable
          if (orderLine.setBodyBorderColor) orderLine.setBodyBorderColor(color);
          if (orderLine.setQuantity) orderLine.setQuantity('');

          // //Sanket - "Attach onMove/onModify callbacks so drag directly triggers processPriceModification.
          //  This is the correct TradingView broker-API pattern: no drawing_event or polling needed."
          if (levelType !== 'entry') {
            if (typeof orderLine.onMove === 'function') {
              orderLine.onMove(function () {
                const movedPrice = this.getPrice ? this.getPrice() : price;
                dragLogger.success(`onMove fired for ${levelType}: newPrice=${movedPrice}`);
                // Update mapping so polling stays in sync
                const m = lineToTradeMapRef.current[lineId];
                if (m) m.price = movedPrice;
                processPriceModification(lineId, movedPrice);
              });
            }
            if (typeof orderLine.onModify === 'function') {
              orderLine.onModify(function () {
                const movedPrice = this.getPrice ? this.getPrice() : price;
                dragLogger.success(`onModify fired for ${levelType}: newPrice=${movedPrice}`);
                const m = lineToTradeMapRef.current[lineId];
                if (m) m.price = movedPrice;
                processPriceModification(lineId, movedPrice);
              });
            }
          }

          dragLogger.success(`Order line created (native): ${lineId}`);

          // Store mapping for event detection
          lineToTradeMapRef.current[lineId] = { tradeId, levelType, price };
          dragLogger.log('MAPPING', `Created mapping for ${lineId}`);

          return { id: lineId, obj: orderLine, type: 'orderline', price };
        } catch (natErr) {
          dragLogger.log('CREATE-NATIVE', `Failed: ${natErr.message}`);
        }
      }

      // Method 2: Shape-based line (Gold standard for Charting Library)
      if (chartRef.current.createShape && typeof chartRef.current.createShape === 'function') {
        try {
          const now = Math.floor(Date.now() / 1000);

          // //Sanket - "Use 'horizontal_line' (single-point, auto-extends full width) instead of
          //  'trend_line' (which requires 2 distinct points). The Charting Library createShape API
          //  takes a single {time, price} object as first arg; passing an array caused
          //  'Wrong points count for trend_line. Required 2'. horizontal_line needs only 1 point
          //  and is draggable when lock:false, firing drawing_event on user drag."
          const shape = await chartRef.current.createShape(
            { time: now, price: price },
            {
              shape: 'horizontal_line',
              text: label,
              lock: false,
              disableSelection: false,
              disableSave: true,
              disableUndo: true,
              overrides: {
                linecolor: color,
                linewidth: 2,
                linestyle: lineStyle,
                showLabel: true,
                textcolor: color,
                fontsize: 12,
              }
            }
          );

          dragLogger.success(`Shape line created: ${lineId}`);

          // //Sanket - "In TradingView Charting Library v25+, createShape returns Promise<EntityId>.
          //  After await, `shape` IS the EntityId (a string). Store it directly so that
          //  drawing_event callbacks can look up our lineId by the TV-assigned entity ID."
          const tvShapeId = (shape !== null && shape !== undefined) ? String(shape) : null;
          dragLogger.log('TV-ID', `TradingView entity id: ${tvShapeId || 'null'}`);

          // Map TV entity ID → our lineId for drawing_event lookup
          if (tvShapeId) {
            tvShapeIdToLineIdRef.current[tvShapeId] = lineId;
            // Also store direct tv-id entry in lineToTradeMap for one-step lookup
            lineToTradeMapRef.current[tvShapeId] = { tradeId, levelType, price, tvShapeId, lineId };
            dragLogger.log('TV-MAPPING', `Stored TV entity mapping: ${tvShapeId} → ${lineId}`);
          }

          // Store mapping keyed by our lineId
          lineToTradeMapRef.current[lineId] = { tradeId, levelType, price, tvShapeId };
          dragLogger.log('MAPPING', `Created mapping for ${lineId} (tvShapeId: ${tvShapeId})`);

          // Store entityId so removeOrderLine can call chart.removeEntity(entityId)
          shapeObjRef.current[lineId] = tvShapeId;
          dragLogger.log('SHAPE-REF', `Stored entity id for ${lineId}`);

          return { id: lineId, obj: shape, type: 'shape', price, tvShapeId };
        } catch (shapeErr) {
          dragLogger.log('CREATE-SHAPE', `Failed: ${shapeErr.message}`);
        }
      }

      // Method 3: Canvas overlay
      dragLogger.log('CREATE', `Falling back to canvas overlay for ${levelType}`);
      priceLinesRef.current[lineId] = {
        price,
        label,
        color,
        lineStyle,
        id: lineId,
        tradeId,
        levelType
      };
      
      lineToTradeMapRef.current[lineId] = { tradeId, levelType, price };
      dragLogger.log('MAPPING', `Created mapping for canvas line ${lineId}`);
      
      if (canvasRef.current) {
        redrawCanvasOverlay();
      }

      dragLogger.success(`Canvas annotation created: ${lineId}`);
      return { id: lineId, obj: null, type: 'canvas', price };
    } catch (err) {
      dragLogger.error(`createOrderLineAtPrice: ${err.message}`);
      return null;
    }
  };

  /**
   * Properly removes a line from the chart and cleans up mappings
   */
  const removeOrderLine = (lineWrapper) => {
    if (!lineWrapper) return;

    try {
      // Handle { id, obj, type, price } wrapper format
      const shape = lineWrapper.obj || lineWrapper;
      const lineId = lineWrapper.id;

      // Remove from all mappings
      if (lineId) {
        delete lineToTradeMapRef.current[lineId];
        delete shapeObjRef.current[lineId];
        delete previousPricesRef.current[lineId];
        console.log(`[Trading] 🗑️ Removed mapping for lineId: ${lineId}`);
        
        // Also remove any tvShapeId mappings that point to this lineId
        Object.keys(tvShapeIdToLineIdRef.current).forEach(tvId => {
          if (tvShapeIdToLineIdRef.current[tvId] === lineId) {
            delete tvShapeIdToLineIdRef.current[tvId];
            delete lineToTradeMapRef.current[tvId]; // Clean up tvShapeId entry in lineToTradeMapRef too
          }
        });
      }
      
      // Remove from shape->trade mapping if it exists
      if (shape) {
        shapeToTradeMapRef.current.delete(shape);
        shapesByObjectRef.current.delete(shape);  // Clean up new mapping too
      }

      if (shape && typeof shape.remove === 'function') {
        shape.remove();
        console.log('[Trading] Removed line via .remove()');
        return true;
      }

      if (shape && chartRef.current) {
        if (typeof chartRef.current.removeEntity === 'function') {
          try {
            // Check if the shape itself is an object with an ID that is a Promise
            // This happens in newer versions of the library
            let targetId = shape;
            
            // If the object has an 'id' property which is a string, use it
            if (shape.id && typeof shape.id === 'string') {
              targetId = shape.id;
            }
            // If the object has an 'id' that is a Promise, we can't remove it synchronously
            // UNLESS we pass the object itself and removeEntity handles it
            
            chartRef.current.removeEntity(targetId);
            console.log('[Trading] Removed line via chart.removeEntity()');
            return true;
          } catch (err) {
            console.log(`[Trading] removeEntity failed: ${err.message}`);
            // Fallback: try calling .remove() on the object itself
            if (shape && typeof shape.remove === 'function') {
              shape.remove();
              return true;
            }
          }
        }
      }

      // For canvas lines, just remove from priceLinesRef
      if (lineWrapper.id && priceLinesRef.current[lineWrapper.id]) {
        delete priceLinesRef.current[lineWrapper.id];
        console.log('[Trading] Removed canvas line:', lineWrapper.id);
        return true;
      }
    } catch (e) {
      console.log('[Trading] Line removal failed:', e.message);
    }
    return false;
  };

  /**
   * Dynamically updates an existing line's label (for live P/L, price changes)
   */
  const updateOrderLineLabel = (lineWrapper, newLabel) => {
    if (!lineWrapper || !lineWrapper.obj) return false;

    try {
      const shape = lineWrapper.obj;

      if (typeof shape.setText === 'function') {
        shape.setText(newLabel);
        console.log('[Trading] Updated line label via setText()');
        return true;
      }

      // For canvas lines, update priceLinesRef
      if (lineWrapper.id && priceLinesRef.current[lineWrapper.id]) {
        priceLinesRef.current[lineWrapper.id].label = newLabel;
        redrawCanvasOverlay();
        return true;
      }
    } catch (e) {
      console.log('[Trading] Line update failed:', e.message);
    }
    return false;
  };

  /**
   * Redraws canvas overlay with all price lines
   */
  const redrawCanvasOverlay = () => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each price line
    Object.values(priceLinesRef.current).forEach(line => {
      // Draw horizontal line (simplified - just a colored line)
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.5); // Rough positioning
      ctx.lineTo(canvas.width, canvas.height * 0.5);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = line.color;
      ctx.font = '12px Arial';
      ctx.fillText(line.label, 10, canvas.height * 0.5 - 5);
    });
  };

  /**
   * Find trade mapping by searching cached shape IDs
   * Shape IDs are now eagerly cached during shape creation
   */
  const findMappingByShapeId = async (eventId) => {
    try {
      // METHOD 1: Check tvShapeId cache (IDs we've successfully cached)
      if (tvShapeIdToLineIdRef.current[eventId]) {
        const lineId = tvShapeIdToLineIdRef.current[eventId];
        const mapping = lineToTradeMapRef.current[lineId];
        if (mapping) {
          console.log(`[Trading] ✓ Found via tvShapeId cache: ${eventId} → ${lineId}`);
          return mapping;
        }
      }
      
      // METHOD 2: Check direct tvShapeId entry in lineToTradeMapRef
      if (lineToTradeMapRef.current[eventId]) {
        const mapping = lineToTradeMapRef.current[eventId];
        if (mapping && mapping.tvShapeId === eventId) {
          console.log(`[Trading] ✓ Found via direct tvShapeId lookup`);
          return mapping;
        }
      }

      // METHOD 3: CRITICAL - Event ID doesn't match cached shape IDs
      // Since shape.id is undefined at creation, try to match by checking stored shapes
      console.log(`[Trading] 🔍 Searching stored shapes for event ID: ${eventId}...`);
      
      for (const [lineId, tradeInfo] of Object.entries(lineToTradeMapRef.current)) {
        const storedShape = shapeObjRef.current[lineId];
        
        if (!storedShape || typeof storedShape !== 'object') continue;
        
        // Try to get the shape's ID now (it might be available by now after delay)
        try {
          if (storedShape.id !== undefined) {
            let shapeId = storedShape.id;
            
            // If it's a Promise, don't block - just check if it's the right ID when resolved
            if (shapeId && typeof shapeId.then === 'function') {
              // Non-blocking: register resolution handler
              shapeId.then(resolvedId => {
                if (resolvedId === eventId && !tvShapeIdToLineIdRef.current[eventId]) {
                  tvShapeIdToLineIdRef.current[eventId] = lineId;
                  console.log(`[Trading] ✓ Late: Resolved shape ID match ${eventId} → ${lineId}`);
                }
              }).catch(() => {});
            } else if (shapeId === eventId) {
              // Synchronous match!
              tvShapeIdToLineIdRef.current[eventId] = lineId;
              console.log(`[Trading] ✓ Found sync shape ID match: ${eventId}`);
              return tradeInfo;
            }
          }
        } catch (e) {
          // Accessing shape.id might throw - that's OK, continue searching
        }
      }
      
      console.warn(`[Trading] ❌ No mapping found for shape ID: ${eventId}`);
      return null;
    } catch (err) {
      console.error('[Trading] Error finding mapping by shape ID:', err);
      return null;
    }
  };

  /**
   * Updates all trade lines on chart
   */
  const updateTradeLines = async (retryCount = 0) => {
    if (!widgetRef.current) {
      console.log('[Trading] updateTradeLines: widget not ready');
      return;
    }
    if (isUpdatingRef.current) {
      console.log('[Trading] updateTradeLines: already updating');
      return;
    }
    if (Object.keys(activeDragsRef.current).length > 0) {
      console.log('[Trading] updateTradeLines: drag in progress');
      return;
    }

    // CRITICAL FIX: Don't update immediately after a modification to avoid duplicates
    const timeSinceModify = Date.now() - modifyTimeoutRef.current;
    if (timeSinceModify < 2000) { // Wait 2 seconds after modification
      console.log(`[Trading] updateTradeLines: cooldown active (${timeSinceModify}ms), skipping update`);
      setTimeout(() => updateTradeLines(), 500);
      return;
    }

    // CRITICAL FIX: Check if trades AND symbol actually changed to avoid unnecessary recreations
    const tradesJson = JSON.stringify(trades);
    if (lastTradesRef.current === tradesJson && lastSymbolRef.current === symbol) {
      console.log('[Trading] updateTradeLines: trades and symbol unchanged, skipping');
      return;
    }
    lastTradesRef.current = tradesJson;
    lastSymbolRef.current = symbol;

    console.log('[Trading] updateTradeLines START - trades count:', trades.length, 'symbol:', symbol);

    isUpdatingRef.current = true;

    try {
      if (!chartRef.current) {
        try {
          chartRef.current = widgetRef.current.activeChart();
        } catch (e) {
          console.warn('[Trading] Could not get activeChart:', e.message);
          if (retryCount < 10) {
            setTimeout(() => updateTradeLines(), 500);
          }
          return;
        }
      }

      const chart = chartRef.current;
      console.log('[Trading] Chart reference obtained');

      // Clear previous shapes - properly remove all existing lines
      let clearedCount = 0;
      let failedCleanup = [];
      
      Object.entries(shapesRef.current).forEach(([tradeId, shapes]) => {
        if (activeDragsRef.current[tradeId]) {
          console.log('[Trading] ⏸️ Skipping cleanup for trade(drag in progress):', tradeId);
          return;
        }
        
        console.log(`[Trading] 🧹 Cleaning up shapes for trade: ${tradeId}`, shapes);
        
        if (shapes.entry) {
          const removed = removeOrderLine(shapes.entry);
          if (removed) clearedCount++;
          else failedCleanup.push('entry');
        }
        if (shapes.sl) {
          const removed = removeOrderLine(shapes.sl);
          if (removed) clearedCount++;
          else failedCleanup.push('sl');
        }
        if (shapes.tp) {
          const removed = removeOrderLine(shapes.tp);
          if (removed) clearedCount++;
          else failedCleanup.push('tp');
        }
      });

      shapesRef.current = {};
      console.log(`[Trading] 🧹 Cleanup complete: ${clearedCount} lines removed${failedCleanup.length > 0 ? `, ${failedCleanup.length} failed: ${failedCleanup.join(',')}` : ''}`);
      
      // Also clear canvas lines
      if (Object.keys(priceLinesRef.current).length > 0) {
        const canvasLineCount = Object.keys(priceLinesRef.current).length;
        priceLinesRef.current = {};
        console.log(`[Trading] 🧹 Cleared ${canvasLineCount} canvas lines`);
        redrawCanvasOverlay();
      }

      // Filter trades for current symbol
      const visibleTrades = trades.filter(trade => {
        const tradeSymbol = (trade.symbol || "").trim().toUpperCase();
        const chartSymbol = (symbol || "").trim().toUpperCase();
        const match = tradeSymbol === chartSymbol || chartSymbol.startsWith(tradeSymbol);
        console.log(`[Trading] Symbol check: trade="${tradeSymbol}" chart="${chartSymbol}" match=${match}`);
        return match;
      });

      console.log('[Trading] Visible trades after filter:', visibleTrades.length);

      if (visibleTrades.length === 0) {
        console.log('[Trading] No matching trades for symbol:', symbol);
        return;
      }

      // Render each trade with order lines
      let totalLinesCreated = 0;
      
      for (const trade of visibleTrades) {
        if (activeDragsRef.current[trade._id]) {
          console.log('[Trading] ⏸️ Skipping trade render (drag in progress):', trade._id);
          continue;
        }

        const entryPrice = parseFloat(trade.openPrice || trade.price || 0);
        console.log(`[Trading] 📊 Processing trade ${trade._id}: entry=${entryPrice}, sl=${trade.stopLoss || trade.sl}, tp=${trade.takeProfit || trade.tp}`);

        if (!entryPrice || entryPrice <= 0) {
          console.warn('[Trading] ❌ Invalid entry price for trade:', trade._id, entryPrice);
          continue;
        }

        const isLong = trade.side === 'BUY';
        const shapes = { entry: null, sl: null, tp: null };

        // ENTRY LINE (3px solid, NOT draggable)
        const entryLabel = `${isLong ? '🚀 BUY' : '🔻 SELL'} ${trade.quantity} @ ${entryPrice.toFixed(2)}`;
        const entryColor = isLong ? '#26a69a' : '#ef5350';
        
        shapes.entry = await createOrderLineAtPrice(entryPrice, entryLabel, entryColor, 0, trade._id, 'entry');
        if (shapes.entry) {
          console.log(`[Trading] ✅ Entry line created: ${entryPrice}`);
          totalLinesCreated++;
        } else {
          console.warn(`[Trading] ❌ Entry line FAILED: ${entryPrice}`);
        }

        // STOP LOSS LINE (2px dashed red, draggable)
        if (trade.stopLoss || trade.sl) {
          const slPrice = parseFloat(trade.stopLoss || trade.sl);
          if (slPrice > 0) {
            const risk = Math.abs((entryPrice - slPrice) * trade.quantity).toFixed(2);
            const slLabel = `🛑 SL @ ${slPrice.toFixed(2)} | Risk: $${risk}`;
            
            shapes.sl = await createOrderLineAtPrice(slPrice, slLabel, '#ef5350', 1, trade._id, 'sl');
            if (shapes.sl) {
              console.log(`[Trading] ✅ SL line created: ${slPrice}`);
              totalLinesCreated++;
            } else {
              console.warn(`[Trading] ❌ SL line FAILED: ${slPrice}`);
            }
          }
        }

        // TAKE PROFIT LINE (2px dashed green, draggable)
        if (trade.takeProfit || trade.tp) {
          const tpPrice = parseFloat(trade.takeProfit || trade.tp);
          if (tpPrice > 0) {
            const reward = Math.abs((tpPrice - entryPrice) * trade.quantity).toFixed(2);
            const tpLabel = `🎯 TP @ ${tpPrice.toFixed(2)} | Reward: $${reward}`;
            
            shapes.tp = await createOrderLineAtPrice(tpPrice, tpLabel, '#26a69a', 1, trade._id, 'tp');
            if (shapes.tp) {
              console.log(`[Trading] ✅ TP line created: ${tpPrice}`);
              totalLinesCreated++;
            } else {
              console.warn(`[Trading] ❌ TP line FAILED: ${tpPrice}`);
            }
          }
        }

        shapesRef.current[trade._id] = shapes;
        
        // Update previousPricesRef for polling detection
        if (shapes.entry?.id) previousPricesRef.current[shapes.entry.id] = shapes.entry.price;
        if (shapes.sl?.id) previousPricesRef.current[shapes.sl.id] = shapes.sl.price;
        if (shapes.tp?.id) previousPricesRef.current[shapes.tp.id] = shapes.tp.price;
      }
      
      console.log(`[Trading] 📈 Total lines created: ${totalLinesCreated} from ${visibleTrades.length} trades`);

      console.log('[Trading] updateTradeLines COMPLETE');
      
      // Redraw canvas overlay with all price lines
      if (canvasRef.current) {
        redrawCanvasOverlay();
      }

    } catch (err) {
      console.error('[Trading] Update error:', err);
    } finally {
      isUpdatingRef.current = false;
    }
  };
  /**
   * Updates live P/L on entry label
   */
  const updateLiveMetrics = () => {
    if (!currentPriceRef.current || !chartRef.current) return;

    trades.forEach(trade => {
      const shapes = shapesRef.current[trade._id];
      if (!shapes?.entry) return;

      const isLong = trade.side === 'BUY';
      const pl = (currentPriceRef.current - trade.openPrice) * trade.quantity * (isLong ? 1 : -1);
      const plSign = pl >= 0 ? '+' : '';
      const plFormatted = `${plSign}$${Math.abs(pl).toFixed(2)}`;

      try {
        const entryLabel = `${isLong ? '🚀 BUY' : '🔻 SELL'} ${trade.quantity} @ ${trade.openPrice} | P/L: ${plFormatted}`;
        if (shapes.entry?.setText) {
          shapes.entry.setText(entryLabel);
        }
      } catch (e) {
        // Silent fail - API may not support setText
      }
    });
  };

  /**
   * Processes price level modification from drag event
   * Validates input and calls modification API
   */
  const processPriceModification = async (shapeId, newPrice) => {
    dragLogger.log('MODIFY', `Starting modification: shapeId=${shapeId}, newPrice=${newPrice}`);

    // //Sanket - "Guard: entry lines must never trigger a modify API call.
    //  A fast lookup check on the mapping stops this before any real work."
    const earlyMapping = lineToTradeMapRef.current[shapeId];
    if (earlyMapping && earlyMapping.levelType === 'entry') {
      dragLogger.log('SKIP', `Entry line drag ignored for ${shapeId}`);
      return;
    }

    // Find mapping - could be our custom lineId or TradingView's shape ID
    let mapping = lineToTradeMapRef.current[shapeId];
    dragLogger.log('LOOKUP', `Direct lookup (lineToTradeMapRef): ${mapping ? '✓ Found' : '✗ Not found'}`);
    
    // If not found, search for tvShapeId match
    if (!mapping) {
      for (const [key, value] of Object.entries(lineToTradeMapRef.current)) {
        if (value.tvShapeId === shapeId) {
          mapping = value;
          dragLogger.log('LOOKUP', `Found via tvShapeId search: key=${key}`);
          break;
        }
      }
    }

    if (!mapping) {
      dragLogger.error(`No mapping found for line ${shapeId}`);
      console.table(lineToTradeMapRef.current);
      return;
    }

    const { tradeId, levelType, price: oldPrice } = mapping;
    dragLogger.log('MAPPING', `levelType=${levelType}, tradeId=${tradeId}, oldPrice=${oldPrice} → newPrice=${newPrice}`);
    
    const trade = trades.find(t => t._id === tradeId);
    
    if (!trade) {
      dragLogger.error(`Trade not found: ${tradeId}`);
      return;
    }

    // Validation: prevent SL/TP from crossing entry
    const entryPrice = parseFloat(trade.openPrice || trade.price || 0);
    const isLong = trade.side === 'BUY';
    
    dragLogger.log('VALIDATION', `Entry: ${entryPrice}, Side: ${trade.side}, Direction: ${isLong ? 'LONG' : 'SHORT'}`);

    if (levelType === 'sl') {
      if (isLong && newPrice >= entryPrice) {
        dragLogger.error(`SL cannot be >= entry for long trade (SL=${newPrice}, Entry=${entryPrice})`);
        return;
      }
      if (!isLong && newPrice <= entryPrice) {
        dragLogger.error(`SL cannot be <= entry for short trade (SL=${newPrice}, Entry=${entryPrice})`);
        return;
      }
    }

    if (levelType === 'tp') {
      if (isLong && newPrice <= entryPrice) {
        dragLogger.error(`TP cannot be <= entry for long trade (TP=${newPrice}, Entry=${entryPrice})`);
        return;
      }
      if (!isLong && newPrice >= entryPrice) {
        dragLogger.error(`TP cannot be >= entry for short trade (TP=${newPrice}, Entry=${entryPrice})`);
        return;
      }
    }

    dragLogger.success(`Validation passed for ${levelType.toUpperCase()}`);

    // Mark as pending update
    activeDragsRef.current[tradeId] = true;
    dragLogger.log('STATE', `activeDragsRef set for ${tradeId}`);

    try {
      const newSL = levelType === 'sl' ? newPrice : (trade.stopLoss || trade.sl);
      const newTP = levelType === 'tp' ? newPrice : (trade.takeProfit || trade.tp);

      dragLogger.log('PAYLOAD', `SL=${newSL}, TP=${newTP}`);

      // Call API to modify trade
      dragLogger.log('API', `Sending PUT to ${API_URL}/trade/modify`);

      // //Sanket - "Include JWT token in Authorization header so the protected
      //  PUT /api/trade/modify route can authenticate the requesting user."
      const token = localStorage.getItem('token') || '';
      const response = await dragLogger.timing('API Call', () =>
        fetch(`${API_URL}/trade/modify`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            tradeId: tradeId,
            sl: parseFloat(newSL),
            tp: parseFloat(newTP)
          })
        })
      );

      const data = await response.json();
      
      dragLogger.log('RESPONSE', `Status: ${response.status}, Success: ${data.success}`);
      
      if (data.success) {
        dragLogger.success(`API SUCCESS: Trade modified ${tradeId}`);
        
        // SET MODIFICATION TIMEOUT to prevent updateTradeLines from recreating lines
        modifyTimeoutRef.current = Date.now();
        dragLogger.log('TIMEOUT', `Modification cooldown started`);
        
        // Update local mapping with new price
        if (mapping) {
          mapping.price = newPrice;
          dragLogger.log('MAPPING', `Updated price in mapping: ${newPrice}`);
        }
        
        // UPDATE LINE LABEL DYNAMICALLY (for immediate visual feedback)
        const shapes = shapesRef.current[tradeId];
        if (shapes) {
          if (levelType === 'sl' && shapes.sl) {
            const risk = Math.abs((entryPrice - newPrice) * trade.quantity).toFixed(2);
            const newLabel = `🛑 SL @ ${newPrice.toFixed(2)} | Risk: $${risk}`;
            if (updateOrderLineLabel(shapes.sl, newLabel)) {
              dragLogger.success(`SL line label updated immediately`);
            }
          }
          
          if (levelType === 'tp' && shapes.tp) {
            const reward = Math.abs((newPrice - entryPrice) * trade.quantity).toFixed(2);
            const newLabel = `🎯 TP @ ${newPrice.toFixed(2)} | Reward: $${reward}`;
            if (updateOrderLineLabel(shapes.tp, newLabel)) {
              dragLogger.success(`TP line label updated immediately`);
            }
          }
        }
        
        // Trigger parent callback to refresh trade data
        if (onTradeModifyRef.current) {
          dragLogger.log('CALLBACK', `Calling parent callback to refresh trades`);
          onTradeModifyRef.current();
        }
      } else {
        dragLogger.error(`API returned error: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      dragLogger.error(`NETWORK ERROR: ${err.message}`);
    } finally {
      delete activeDragsRef.current[tradeId];
      dragLogger.log('STATE', `activeDragsRef cleared for ${tradeId}`);
    }
  };

  /**
   * Attaches drawing event listeners for draggable lines
   * Uses multiple detection methods: widget events + polling fallback
   */
  const attachEventListeners = (widget) => {
    try {
      console.log('[Trading] 👂 Attaching event listeners (Method 1: widget.subscribe)...');

      // Method 1: Widget drawing_event subscription
      try {
        widget.subscribe('drawing_event', async (id, status, object) => {
          dragLogger.event('drawing_event', { id, status, hasObject: !!object });
          dragLogger.log('EVENT', `Status: ${status}`);

          // TradingView fires 'points_changed' when a shape is dragged/moved.
          // Some older versions fire 'stopped'. Accept both.
          if ((status === 'stopped' || status === 'points_changed' || status === 'move') && id) {
            dragLogger.log('DRAG-DETECTED', `Event status: ${status}, ID: ${id}`);

            try {
              let mapping = null;
              let newPrice = null;
              const eventId = String(id);

              // //Sanket - "Three-step lookup: (1) direct line-id, (2) tv entity-id → line-id,
              //  (3) full tvShapeId scan. After the entity-id fix at creation time, step (2)
              //  will reliably find the mapping for shapes created via createShape."

              // Step 1: direct lookup by our lineId (works for createOrderLine lines)
              mapping = lineToTradeMapRef.current[eventId];
              if (mapping) dragLogger.log('LOOKUP-1', `✓ Direct lineId hit`);

              // Step 2: look up by TV entity ID → lineId mapping
              if (!mapping && tvShapeIdToLineIdRef.current[eventId]) {
                const resolvedLineId = tvShapeIdToLineIdRef.current[eventId];
                mapping = lineToTradeMapRef.current[resolvedLineId];
                if (mapping) dragLogger.log('LOOKUP-2', `✓ Via tvShapeId→lineId: ${resolvedLineId}`);
              }

              // Step 3: full scan for tvShapeId match (last resort)
              if (!mapping) {
                for (const [, value] of Object.entries(lineToTradeMapRef.current)) {
                  if (value && value.tvShapeId === eventId) {
                    mapping = value;
                    dragLogger.log('LOOKUP-3', `✓ Via tvShapeId scan`);
                    break;
                  }
                }
              }

              if (!mapping) {
                dragLogger.error(`No mapping found for event id: ${eventId}`);
                return;
              }

              dragLogger.success(`Mapping resolved: ${mapping.levelType} for trade ${mapping.tradeId}`);

              // //Sanket - "Price extraction after drag uses four methods in priority order:
              //  P1: chart.getShapeById(entityId).getPoints()[0].price  (TradingView v25+ charting library)
              //  P2: object.getPoints()[0].price  (older TV versions pass entity as 3rd arg)
              //  P3: object.getPrice() / object.price  (order-line object, some TV versions)
              //  P4: object as a raw number  (some TV versions pass price directly as 3rd param)"

              // P1: chart.getShapeById — most reliable for v25+ after entity ID is correctly stored
              if (!newPrice && chartRef.current && typeof chartRef.current.getShapeById === 'function') {
                try {
                  const shapeEntity = chartRef.current.getShapeById(eventId);
                  if (shapeEntity && typeof shapeEntity.getPoints === 'function') {
                    const pts = shapeEntity.getPoints();
                    if (Array.isArray(pts) && pts.length > 0 && pts[0]?.price !== undefined) {
                      newPrice = parseFloat(pts[0].price);
                      dragLogger.log('PRICE-P1', `getShapeById.getPoints()[0].price = ${newPrice}`);
                    }
                  }
                } catch (e) {
                  dragLogger.log('PRICE-P1', `getShapeById failed: ${e.message}`);
                }
              }

              // P2: object.getPoints() — older TV versions pass entity as 3rd event arg
              if (!newPrice && object && typeof object.getPoints === 'function') {
                try {
                  const pts = object.getPoints();
                  if (Array.isArray(pts) && pts.length > 0 && pts[0]?.price !== undefined) {
                    newPrice = parseFloat(pts[0].price);
                    dragLogger.log('PRICE-P2', `object.getPoints()[0].price = ${newPrice}`);
                  }
                } catch (e) {
                  dragLogger.log('PRICE-P2', `object.getPoints failed: ${e.message}`);
                }
              }

              // P3: object.getPrice() / object.price (order-line entity)
              if (!newPrice && object) {
                if (typeof object.getPrice === 'function') {
                  try { newPrice = object.getPrice(); dragLogger.log('PRICE-P3', `object.getPrice() = ${newPrice}`); } catch (e) {}
                }
                if (!newPrice && typeof object.price === 'number') {
                  newPrice = object.price;
                  dragLogger.log('PRICE-P3b', `object.price = ${newPrice}`);
                }
              }

              // P4: third argument is a raw price number (some TV versions)
              if (!newPrice && typeof object === 'number' && object > 0) {
                newPrice = object;
                dragLogger.log('PRICE-P4', `raw 3rd-arg price = ${newPrice}`);
              }

              // Process the modification on drag stop
              if (newPrice && newPrice > 0) {
                dragLogger.success(`🖱️ Ready to process: ${mapping.levelType} → ${newPrice}`);
                const lineId = mapping.lineId || id;
                dragLogger.log('PROCESS', `Calling processPriceModification: lineId=${lineId}, price=${newPrice}`);
                processPriceModification(lineId, newPrice);
              } else if (!newPrice) {
                dragLogger.error(`Could not extract price from dragged shape. Status: ${status}`);
              } else {
                dragLogger.log('SKIP', `Price invalid or wrong status. price=${newPrice}, status=${status}`);
              }
            } catch (e) {
              dragLogger.error(`Handler error: ${e.message}`);
            }
          }
        });
        console.log('[Trading] ✅ widget.subscribe("drawing_event") attached');
      } catch (e) {
        console.warn('[Trading] widget.subscribe failed:', e.message);
      }

      // Method 2: Polling-based detection (fallback for when events don't fire)
      // //Sanket - "Store interval ID in pollIntervalRef so it can be cleared on unmount.
      //  The interval watches lineToTradeMapRef for price changes that onMove already updates.
      //  This covers edge-cases where drawing_event fires but onMove is unavailable."
      console.log('[Trading] 👂 Attaching listener (Method 2: polling fallback)...');
      pollIntervalRef.current = setInterval(() => {
        if (!chartRef.current) return;
        
        // Skip polling if trades are being updated
        if (isUpdatingRef.current) return;

        try {
          // Poll our stored mappings (not the shapes themselves)
          for (const [lineId, mapping] of Object.entries(lineToTradeMapRef.current)) {
            if (!mapping || !mapping.price) continue;
            
            if (activeDragsRef.current[mapping.tradeId]) {
              continue; // Skip if already processing drag
            }

            try {
              const currentPrice = mapping.price;
              
              // Skip invalid prices
              if (!currentPrice || currentPrice <= 0) {
                continue;
              }

              const previousPrice = previousPricesRef.current[lineId];
              
              // Only trigger if we have a previous price to compare against
              if (previousPrice === undefined) {
                previousPricesRef.current[lineId] = currentPrice;
                continue;
              }

              const priceDiff = Math.abs(currentPrice - previousPrice);
              
              // If price changed significantly (more than 0.1 point), trigger modification
              if (priceDiff > 0.1) {
                dragLogger.event('POLLING-DETECTED', `${mapping.levelType} moved ${previousPrice} → ${currentPrice} (diff: ${priceDiff.toFixed(4)})`);
                dragLogger.log('POLL-DRAG', `Processing drag for ${lineId}`);
                processPriceModification(lineId, currentPrice);
              }

              // Always update previous price for next comparison
              previousPricesRef.current[lineId] = currentPrice;
            } catch (e) {
              dragLogger.log('POLL-ERROR', `Polling check failed for ${lineId}: ${e.message}`);
            }
          }
        } catch (e) {
          dragLogger.log('POLL-ERROR', `Polling error: ${e.message}`);
        }
      }, 300); // Check every 300ms for faster detection

      console.log('[Trading] ✅ Events listener attached (both methods)');

    } catch (e) {
      console.error('[Trading] Could not attach listeners:', e.message);
    }
  };

  /**
   * Initialize TradingView widget
   */
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;

    try {
      const widget = new window.TradingView.widget({
        symbol: symbol,
        interval: "1",
        container: containerRef.current,
        library_path: "/charting_library/",
        locale: "en",
        theme: "dark",
        autosize: true,
        datafeed: Datafeed,
        symbol_search_request_delay: 1000,
        disabled_features: [
          "use_localstorage_for_settings",
          "save_chart_properties_to_local_storage",
          "header_saveload",
          "display_market_status"
        ],
        enabled_features: [
          "header_resolutions",
          "header_chart_type",
          "header_indicators",
          "countdown",
          "trading_objects"
        ],
        overrides: {
          "paneProperties.background": "#0d0d0d",
          "mainSeriesProperties.style": 1,
          "mainSeriesProperties.showCountdown": true
        }
      });

      widget.onChartReady(() => {
        console.log('[Trading] onChartReady callback fired');
        widgetRef.current = widget;
        chartRef.current = widget.activeChart();
        
        // CRITICAL FIX: Reset change tracking refs when new chart instance loads
        // Otherwise stale values prevent updateTradeLines from running
        lastTradesRef.current = null;
        lastSymbolRef.current = null;
        
        // Debug: Log available chart methods
        console.log('[Trading] Chart available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(chartRef.current)).filter(m => typeof chartRef.current[m] === 'function').slice(0, 20));
        console.log('[Trading] createOrderLine available?', typeof chartRef.current.createOrderLine);
        console.log('[Trading] createShape available?', typeof chartRef.current.createShape);
        
        // Setup canvas overlay if not already created
        if (!overlayRef.current) {
          const overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '10';
          
          const canvas = document.createElement('canvas');
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.display = 'block';
          
          overlay.appendChild(canvas);
          containerRef.current.style.position = 'relative';
          containerRef.current.appendChild(overlay);
          
          overlayRef.current = overlay;
          canvasRef.current = canvas;
          console.log('[Trading] Canvas overlay created');
        }
        
        console.log('[Trading] Calling attachEventListeners');
        attachEventListeners(widget);
        
        console.log('[Trading] Calling updateTradeLines from onChartReady');
        updateTradeLines();

        try {
          chartRef.current.onIntervalChanged().subscribe(null, () => {
            console.log('[Trading] Interval changed, re-rendering...');
            setTimeout(() => updateTradeLines(), 500);
          });
        } catch (e) {
          console.warn('[Trading] Could not subscribe to interval:', e.message);
        }

        console.log('[Trading] Chart ready:', symbol);
      });

      return () => {
        // //Sanket - "Clear polling interval on unmount to prevent memory/timer leak.
        //  Without this, the interval keeps running after the component unmounts."
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        try {
          if (widgetRef.current) {
            widgetRef.current.remove();
            widgetRef.current = null;
            chartRef.current = null;
          }
        } catch (e) {
          console.error('[Trading] Cleanup error:', e);
        }
      };
    } catch (err) {
      console.error('[Trading] Init error:', err);
    }
  }, [symbol]);

  /**
   * Price stream listener
   */
  useEffect(() => {
    const handlePrice = (e) => {
      if (e.detail?.symbol === symbol) {
        currentPriceRef.current = e.detail.bid;
        updateLiveMetrics();
      }
    };

    const priceStream = getMetaApiPriceEvents();
    priceStream.addEventListener("priceUpdate", handlePrice);

    return () => {
      priceStream.removeEventListener("priceUpdate", handlePrice);
    };
  }, [symbol, trades]);

  /**
   * Redraw on trade changes
   */
  useEffect(() => {
    console.log('[Trading] useEffect trade dependency triggered - trades.length:', trades.length);
    updateTradeLines();
  }, [trades]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        height: "600px",
        backgroundColor: "#0d0d0d"
      }} 
    />
  );
};

export default Advance_Trading_View_Chart;
