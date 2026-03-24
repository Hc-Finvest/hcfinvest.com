import { useEffect, useRef, useState } from "react";
import Datafeed from "../services/datafeed.js";
import { getPriceEvents } from '../services/priceStream';
import { TradeLineManager } from "../utils/TradeLineManager.js";

const canonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';

  //Sanket v2.0 - Normalize XAU/USD, XAUUSDm, XAUUSD.pro variants to one stable key.
  const compact = value.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  if (/^[A-Z]{6}[A-Z]$/.test(compact)) return compact.slice(0, 6);
  if (/^[A-Z]{6}/.test(compact)) return compact.slice(0, 6);
  return compact;
};

const purgeTradingViewPersistedState = () => {
  //Sanket v2.0 - Clear only TradingView persisted blobs that can break schema on library upgrades.
  // This removes stale layout/settings entries that trigger "state data type ... does not match schema".
  const shouldPurgeKey = (key) => {
    const k = String(key || '').toLowerCase();
    return (
      k.includes('tradingview') ||
      k.includes('tv_chart') ||
      k.includes('chartproperties') ||
      k.includes('chartlayout') ||
      k.includes('charting_library') ||
      k.includes('tv_ecosystem') ||
      k.includes('tv.study') ||
      k.includes('study_templates')
    );
  };

  try {
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && shouldPurgeKey(key)) localKeys.push(key);
    }
    localKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}

  try {
    const sessionKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && shouldPurgeKey(key)) sessionKeys.push(key);
    }
    sessionKeys.forEach((k) => sessionStorage.removeItem(k));
  } catch (e) {}
};

/**
 * Production-Grade Trading Chart Component
 * Manages trade visualization using TradingView Charting Library
 * Integrates TradeLineManager for Exness-style draggable order lines.
 */
const Advance_Trading_View_Chart = ({ symbol = "XAUUSD", trades = [], onTradeModify }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const chartRef = useRef(null);
  const managerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const latestSymbolRef = useRef(symbol);
  const latestTradesRef = useRef(trades);
  const latestOnTradeModifyRef = useRef(onTradeModify);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartReadyRef = useRef(false);
  
  // Track continuous price for metrics if needed
  const currentPriceRef = useRef(null);

  useEffect(() => {
    latestSymbolRef.current = symbol;
    latestTradesRef.current = trades;
    latestOnTradeModifyRef.current = onTradeModify;
  }, [symbol, trades, onTradeModify]);

  /**
   * Initialize TradingView widget & TradeLineManager once.
   */
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;
    if (widgetRef.current || isInitializingRef.current) return;

    //Sanket v2.0 - Lock initialization so widget creation cannot run twice for a single mount.
    // This prevents accidental duplicate TradingView instances and repeated onChartReady churn.
    isInitializingRef.current = true;

    try {
      purgeTradingViewPersistedState();

      const widget = new window.TradingView.widget({
        symbol: latestSymbolRef.current || "XAUUSD",
        interval: "1",
        container: containerRef.current,
        library_path: "/charting_library/",
        load_last_chart: false,
        locale: "en",
        theme: "light",
        autosize: true,
        datafeed: Datafeed,
        symbol_search_request_delay: 1000,
        disabled_features: [
          "use_localstorage_for_settings",
          "save_chart_properties_to_local_storage",
          "header_saveload"
        ],
        enabled_features: [
          "header_resolutions",
          "header_chart_type",
          "trading_objects"
        ],
        overrides: {
          "paneProperties.background": "#ffffff",
          "mainSeriesProperties.style": 1,
        }
      });

      widget.onChartReady(() => {
        chartReadyRef.current = true;
        setIsChartReady(true);
        console.log(`[Trading] onChartReady triggered for ${latestSymbolRef.current}`);
        widgetRef.current = widget;
        chartRef.current = widget.activeChart();

        // Instantiate manager
        managerRef.current = new TradeLineManager(chartRef, (...args) => latestOnTradeModifyRef.current?.(...args));
        managerRef.current.initialize(widget);
        
        // Initial sync
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
          chartRef.current = null;
          chartReadyRef.current = false;
          setIsChartReady(false);
        }
      };
    } catch (err) {
      isInitializingRef.current = false;
      console.error('[Trading] Chart Init error:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Switch symbol without recreating widget.
   */
  useEffect(() => {
    if (!widgetRef.current || !chartReadyRef.current || !symbol) return;
    try {
      const current = chartRef.current?.symbol?.();
      if (typeof current === 'string' && canonicalSymbol(current) === canonicalSymbol(symbol)) return;
    } catch (e) {}

    try {
      widgetRef.current.setSymbol(symbol, "1", () => {
        if (managerRef.current) {
          managerRef.current.syncTrades(latestTradesRef.current, symbol);
        }
      });
    } catch (e) {
      console.error('[Trading] setSymbol error:', e);
    }
  }, [symbol, isChartReady]);

  /**
   * Sync trades to TradeLineManager whenever they change
   */
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.syncTrades(trades, symbol);
    }
  }, [trades, symbol]);

  /**
   * Live Price stream listener for continuous DOM updates or tracking
   */
  useEffect(() => {
    const handlePriceUpdate = (e) => { // Renamed from handlePrice to handlePriceUpdate
      if (e.detail?.symbol === symbol) {
        currentPriceRef.current = e.detail.bid;
      }
    };
    const priceEvents = getPriceEvents(); // Changed from getMetaApiPriceEvents to getPriceEvents
    priceEvents.addEventListener('priceUpdate', handlePriceUpdate); // Changed from priceStream to priceEvents and handlePrice to handlePriceUpdate
    
    return () => {
      priceEvents.removeEventListener("priceUpdate", handlePriceUpdate); // Changed from priceStream to priceEvents and handlePrice to handlePriceUpdate
    };
  }, [symbol]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        height: "100%",
        backgroundColor: "#341b1b"
      }} 
    />
  );
};

export default Advance_Trading_View_Chart;
