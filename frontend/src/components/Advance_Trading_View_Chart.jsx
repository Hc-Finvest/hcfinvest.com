import { useEffect, useRef, useState } from "react";
import Datafeed from "../services/datafeed.js";
import { getPriceEvents } from '../services/priceStream';
import { TradeLineManager } from "../utils/TradeLineManager.js";

// ─── v7.55 localStorage Keys ────────────────────────────────────────────────
const LS_SYMBOL   = 'hcf_chart_symbol';
const LS_INTERVAL = 'hcf_chart_interval';

const canonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  const compact = value.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  if (/^[A-Z]{6}[A-Z]$/.test(compact)) return compact.slice(0, 6);
  if (/^[A-Z]{6}/.test(compact)) return compact.slice(0, 6);
  return compact;
};

/**
 * Production-Grade Trading Chart Component — v7.55
 * - Persists symbol, interval, and all chart settings across refreshes.
 * - Volume indicator and other indicators are saved/restored automatically.
 * - Active tab symbol is always what the chart loads on refresh.
 */
const Advance_Trading_View_Chart = ({ symbol = "XAUUSD", trades = [], onTradeModify, isDarkMode = false, onSymbolChange }) => {
  const containerRef  = useRef(null);
  const widgetRef     = useRef(null);
  const chartRef      = useRef(null);
  const managerRef    = useRef(null);
  const isInitializingRef = useRef(false);
  const latestSymbolRef = useRef(symbol);
  const latestTradesRef = useRef(trades);
  const latestOnTradeModifyRef = useRef(onTradeModify);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartReadyRef = useRef(false);
  const currentPriceRef = useRef(null);

  // ─── Keep latest refs in sync ─────────────────────────────────────────────
  useEffect(() => {
    latestSymbolRef.current = symbol;
    latestTradesRef.current = trades;
    latestOnTradeModifyRef.current = onTradeModify;

    // v7.55: Persist the active tab symbol every time the prop changes
    if (symbol) {
      try { localStorage.setItem(LS_SYMBOL, symbol); } catch (e) {}
    }
  }, [symbol, trades, onTradeModify]);

  // ─── Initialize TradingView widget ONCE ───────────────────────────────────
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;
    if (widgetRef.current || isInitializingRef.current) return;

    isInitializingRef.current = true;

    try {
      // v7.55: Read saved interval (fallback "1") and symbol
      const savedInterval = localStorage.getItem(LS_INTERVAL) || "1";
      const initSymbol    = latestSymbolRef.current || localStorage.getItem(LS_SYMBOL) || "XAUUSD";

      const widget = new window.TradingView.widget({
        // ── Core ──────────────────────────────────────────────────────────
        symbol:   initSymbol,
        interval: savedInterval,           // ✅ FIX #2: Use saved interval
        container: containerRef.current,
        library_path: "/charting_library/",

        // ✅ FIX #1: load_last_chart MUST be true to restore indicators/drawings
        load_last_chart: true,

        locale: "en",
        theme: isDarkMode ? "dark" : "light", // ✅ v7.55: Sync with app theme
        autosize: true,
        datafeed: Datafeed,
        symbol_search_request_delay: 1000,

        // ── Feature flags ─────────────────────────────────────────────────
        disabled_features: [
          "header_saveload"
        ],
        enabled_features: [
          "use_localstorage_for_settings",
          "save_chart_properties_to_local_storage",
          "header_resolutions",
          "header_chart_type",
          "trading_objects"
        ],

        overrides: {
          "paneProperties.background": isDarkMode ? "#0d0d0d" : "#ffffff", // ✅ v7.55: Dynamic background
          "mainSeriesProperties.style": 1,
        }
      });

      widget.onChartReady(() => {
        chartReadyRef.current = true;
        setIsChartReady(true);
        console.log(`[v7.55] Chart ready | symbol=${initSymbol} | interval=${savedInterval} | theme=${isDarkMode ? 'dark' : 'light'}`);

        widgetRef.current = widget;
        chartRef.current  = widget.activeChart();

        // ✅ FIX #2: Save interval whenever user changes it
        chartRef.current.onIntervalChanged().subscribe(null, (interval) => {
          console.log(`[v7.55] Interval changed → ${interval}`);
          try { localStorage.setItem(LS_INTERVAL, interval); } catch (e) {}
        });

        // ✅ FIX #3: Save symbol whenever chart changes it (e.g. via search bar)
        // AND notify parent TradingPage to sync tabs
        chartRef.current.onSymbolChanged().subscribe(null, () => {
          try {
            const sym = chartRef.current?.symbol?.();
            if (sym) {
              console.log(`[v7.55] Internal symbol changed → ${sym}`);
              localStorage.setItem(LS_SYMBOL, sym);
              if (onSymbolChange) onSymbolChange(sym); // 🔄 Sync with parent tabs
            }
          } catch (e) {}
        });

        // Instantiate trade line manager
        managerRef.current = new TradeLineManager(
          chartRef,
          (...args) => latestOnTradeModifyRef.current?.(...args)
        );
        managerRef.current.initialize(widget);
        managerRef.current.syncTrades(latestTradesRef.current, latestSymbolRef.current);

        isInitializingRef.current = false;
      });

      return () => {
        isInitializingRef.current = false;
        if (managerRef.current) {
          managerRef.current.destroy();
          managerRef.current = null;
        }
        if (widgetRef.current) {
          widgetRef.current.remove();
          widgetRef.current = null;
          chartRef.current  = null;
          chartReadyRef.current = false;
          setIsChartReady(false);
        }
      };
    } catch (err) {
      isInitializingRef.current = false;
      console.error('[v7.55] Chart init error:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Dynamic Theme Switch ─────────────────────────────────────────────────
  useEffect(() => {
    if (!widgetRef.current || !chartReadyRef.current) return;
    
    try {
      const theme = isDarkMode ? "dark" : "light";
      const bg = isDarkMode ? "#0d0d0d" : "#ffffff";
      
      // Update overrides for background
      widgetRef.current.applyOverrides({
        "paneProperties.background": bg,
      });

      // ✅ v7.55: Use changeTheme for a full aesthetic transition
      if (typeof widgetRef.current.changeTheme === 'function') {
        widgetRef.current.changeTheme(theme);
        console.log(`[v7.55] Target theme switched → ${theme}`);
      }
    } catch (e) {
      console.error('[v7.55] Theme update error:', e);
    }
  }, [isDarkMode, isChartReady]);

  // ─── Switch symbol without recreating widget ───────────────────────────────
  useEffect(() => {
    if (!widgetRef.current || !chartReadyRef.current || !symbol) return;
    try {
      const current = chartRef.current?.symbol?.();
      // 🛡️ v7.57: Revert strict comparison to use canonicalSymbol to prevent bouncing loops with .i datafeeds
      if (typeof current === 'string' && canonicalSymbol(current) === canonicalSymbol(symbol)) return;
    } catch (e) {}

    // v7.55: Use saved interval when switching symbols (not hardcoded "1")
    const savedInterval = localStorage.getItem(LS_INTERVAL) || "1";

    try {
      widgetRef.current.setSymbol(symbol, savedInterval, () => {
        console.log(`[v7.55] Symbol switched → ${symbol} @ ${savedInterval}`);
        if (managerRef.current) {
          managerRef.current.syncTrades(latestTradesRef.current, symbol);
        }
      });
    } catch (e) {
      console.error('[v7.55] setSymbol error:', e);
    }
  }, [symbol, isChartReady]);

  // ─── Sync trades whenever they change ─────────────────────────────────────
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.syncTrades(trades, symbol);
    }
  }, [trades, symbol]);

  // ─── Live price stream listener ───────────────────────────────────────────
  useEffect(() => {
    const handlePriceUpdate = (e) => {
      if (e.detail?.symbol === symbol) {
        currentPriceRef.current = e.detail.bid;
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
