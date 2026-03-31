import { useEffect, useRef, useState, useCallback } from "react";
import Datafeed from "../services/datafeed.js";
import { getPriceEvents } from '../services/priceStream';
import { TradeLineManager } from "../utils/TradeLineManager.js";
import { useInterpolation } from "../hooks/useInterpolation";
import { API_URL } from "../config/api";
import { canonicalSymbol, normalizeSymbol } from "../utils/symbolUtils.js";

// ─── v7.60 Configuration ───────────────────────────────────────────────────
const DEBOUNCE_SAVE_MS = 2000; // Auto-save after 2 seconds of inactivity

/**
 * Institutional-Grade Trading Chart Component — v7.60
 * - Persists all chart settings, indicators, and drawings to the backend.
 * - Resolves symbol desync bugs by using absolute source-of-truth prop syncing.
 * - Supports multi-device state synchronization via MongoDB ChartLayout.
 */
const Advance_Trading_View_Chart = ({ 
  symbol = "XAUUSD", 
  trades = [], 
  onTradeModify, 
  isDarkMode = false, 
  onSymbolChange, 
  adminSpreads = {} 
}) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const chartRef = useRef(null);
  const managerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const lastSetSymbolRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  
  const [isChartReady, setIsChartReady] = useState(false);
  const chartReadyRef = useRef(false);
  const [targetPrice, setTargetPrice] = useState(0);
  const currentPriceRef = useRef(null);

  // ─── SMOOTH INTERPOLATION ──────────────────────────────────────────────────
  const displayPrice = useInterpolation(targetPrice, 0.2);

  // Sync interpolated price to manager and datafeed for smooth updates
  useEffect(() => {
    if (isChartReady) {
      // 1. Update order lines/PnL labels via manager
      if (managerRef.current) {
        managerRef.current.updateLivePrice(symbol, displayPrice);
      }
      // 2. Inject smooth price into TradingView candle updates
      // Using mid-price for candles to keep display consistent with standard charts
      const mid = typeof displayPrice === 'object' ? (displayPrice.bid + displayPrice.ask) / 2 : displayPrice;
      Datafeed.updateInterpolatedTick?.(symbol, mid);
    }
  }, [displayPrice, symbol, isChartReady]);

  // ─── GET USER ID ──────────────────────────────────────────────────────────
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?._id || user?.id;
    } catch (e) {
      return null;
    }
  };

  // ─── BACKEND PERSISTENCE LOGIC ────────────────────────────────────────────
  
  const saveChartToBackend = useCallback(async () => {
    const userId = getUserId();
    if (!userId || !widgetRef.current || !chartReadyRef.current) return;

    try {
      //Sanket v2.0 - Clear managed SL/TP/entry lines before saving so they don't get baked into
      // the layoutJson. Stale shape IDs in saved state cause "Can't find source" errors and
      // TradingView schema mismatches on next load. Re-sync after save to restore them.
      const manager = managerRef.current;
      if (manager) manager.clearAllManagedDrawings();

      widgetRef.current.save((layoutJson) => {
        // Re-sync trade lines immediately after snapshot is captured
        if (manager) manager.syncTrades(manager.trades || [], symbol);

        fetch(`${API_URL}/chart/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            symbol: 'GLOBAL', // Save to a global layout for full sync
            layoutJson
          })
        }).then(res => res.json())
          .then(data => {
            if (data.success) {
            }
          });
      });
    } catch (err) {
    }
  }, [symbol]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveChartToBackend, DEBOUNCE_SAVE_MS);
  }, [saveChartToBackend]);

  const loadChartFromBackend = async (widget) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/chart/load/${userId}?symbol=GLOBAL`);
      const data = await res.json();
      
      if (data.success && data.layoutJson) {
        widget.load(data.layoutJson);
      } else {
      }
    } catch (err) {
    }
  };

  // ─── Initialize TradingView widget ONCE ───────────────────────────────────
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;
    if (widgetRef.current || isInitializingRef.current) return;

    isInitializingRef.current = true;
    const userId = getUserId();

    try {
      const widget = new window.TradingView.widget({
        symbol: normalizedSymbol,
        interval: "1",
        container: containerRef.current,
        library_path: "/charting_library/",
        locale: "en",
        theme: isDarkMode ? "dark" : "light",
        autosize: true,
        datafeed: Datafeed,
        
        // Use client credentials to enable internal storage hooks if needed
        client_id: 'hcf_trading_v1',
        user_id: userId || 'anonymous',
        
        disabled_features: [
          "header_saveload",
          "use_localstorage_for_settings" // Disabled in favor of our backend system
        ],
        enabled_features: [
          "header_resolutions",
          "header_chart_type",
          "trading_objects",
          "side_toolbar_in_fullscreen_mode"
        ],
        overrides: {
          "paneProperties.background": isDarkMode ? "#0d0d0d" : "#ffffff"
        }
      });

      widget.onChartReady(async () => {
        
        // 1. Initial Load from Backend
        await loadChartFromBackend(widget);

        // 2. State Setup
        chartReadyRef.current = true;
        setIsChartReady(true);
        widgetRef.current = widget;
        chartRef.current = widget.activeChart();
        lastSetSymbolRef.current = normalizedSymbol;

        // 3. Subscription Hooks for Auto-Save
        chartRef.current.onIntervalChanged().subscribe(null, (interval) => {
          localStorage.setItem('hcf_chart_interval', interval);
          debouncedSave();
        });

        chartRef.current.onSymbolChanged().subscribe(null, () => {
          const sym = chartRef.current?.symbol?.();
          if (sym && onSymbolChange) onSymbolChange(sym);
          debouncedSave();
        });

        // 4. Persistence Listeners for Drawings/indicators/candle colors
        widget.subscribe('onAutoSaveNeeded', () => {
          debouncedSave();
        });

        // v7.83 Specific Style Listeners (Ensures candle colors save)
            widget.headerReady().then(() => {
                const headerContainer = widget.headerReady();
            });
        
        widget.activeChart().onChartTypeChanged().subscribe(null, () => {
           debouncedSave();
        });

        // 5. Initialize Trade Lines
        managerRef.current = new TradeLineManager(
          chartRef,
          (...args) => onTradeModify?.(...args)
        );
        managerRef.current.initialize(widget);
        managerRef.current.syncTrades(trades, symbol);

        isInitializingRef.current = false;
      });

      return () => {
        isInitializingRef.current = false;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (managerRef.current) {
          managerRef.current.destroy();
          managerRef.current = null;
        }
        if (widgetRef.current) {
          widgetRef.current.remove();
          widgetRef.current = null;
          chartRef.current = null;
          chartReadyRef.current = false;
          setIsChartReady(false);
        }
      };
    } catch (err) {
      isInitializingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastThemeRef = useRef(isDarkMode ? "dark" : "light");

  // ─── Theme Sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!widgetRef.current || !isChartReady) return;
    try {
      const newTheme = isDarkMode ? "dark" : "light";
      if (newTheme !== lastThemeRef.current) {
        widgetRef.current.changeTheme(newTheme);
        lastThemeRef.current = newTheme;
      }
    } catch (e) {
    }
  }, [isDarkMode, isChartReady]);

  // ─── CRITICAL: SYMBOL SYNC (Fixes XAU/GBP desync) ──────────────────────────
  useEffect(() => {
    if (!widgetRef.current || !chartReadyRef.current || !normalizedSymbol) return;
    
    // 🛡️ Prevent redundant setSymbol calls if already on the correct symbol
    const current = chartRef.current?.symbol?.();
    if (typeof current === 'string' && canonicalSymbol(current) === canonicalSymbol(normalizedSymbol)) {
      return;
    }

    if (widgetRef.current && chartReadyRef.current && normalizedSymbol !== lastSetSymbolRef.current) {
      widgetRef.current.setSymbol(normalizedSymbol, widgetRef.current.activeChart().resolution(), () => {
        lastSetSymbolRef.current = normalizedSymbol;
        if (managerRef.current) {
          managerRef.current.syncTrades(trades, symbol, true); // force sync to clear fossils
        }
      });
    }
  }, [normalizedSymbol, isChartReady, trades, symbol]);

  // ─── Sync trades ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.syncTrades(trades, symbol);
    }
  }, [trades, symbol]);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setAdminSpreads(adminSpreads);
      managerRef.current.syncTrades(trades, symbol);
    }
  }, [adminSpreads, trades, symbol]);

  // ─── Live price stream listener ───────────────────────────────────────────
  useEffect(() => {
    const handlePriceUpdate = (e) => {
      //Sanket v2.0 - Normalize both sides so XAUUSD.i matches XAUUSD tick events
      const tickSymbol = String(e.detail?.symbol || '').toUpperCase().replace(/\.I$/i, '');
      const chartSymbol = String(symbol || '').toUpperCase().replace(/\.I$/i, '');
      if (tickSymbol === chartSymbol) {
        const { bid, ask } = e.detail;
        currentPriceRef.current = bid; // Keep bid as primary ref for simplicity
        setTargetPrice({ bid, ask });
      }
    };
    const priceEvents = getPriceEvents();
    priceEvents.addEventListener('priceUpdate', handlePriceUpdate);
    return () => {
      priceEvents.removeEventListener("priceUpdate", handlePriceUpdate);
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0d0d0d"
      }}
    />
  );
};

export default Advance_Trading_View_Chart;
