import { useEffect, useRef, useState, useCallback } from "react";
import Datafeed from "../services/datafeed.js";
import { getPriceEvents } from '../services/eventSystem';
import { TradeLineManager } from "../utils/TradeLineManager.js";
import { useInterpolation } from "../hooks/useInterpolation";
import { API_URL } from "../config/api";
import { canonicalSymbol, normalizeSymbol } from "../utils/symbolUtils.js";

// ─── v7.60 Configuration ───────────────────────────────────────────────────
const DEBOUNCE_SAVE_MS = 2000; // Auto-save after 2 seconds of inactivity
const CHART_LAYOUT_VERSION = 2;

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
  adminSpreads = {},
  selectedSide = 'BUY'
}) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const chartRef = useRef(null);
  const managerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const lastSetSymbolRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  //Sanket v2.0 - Refs that always hold the latest trades/symbol props without stale closure.
  // The onChartReady useEffect has empty deps [] so its inner setTimeout captures stale values
  // from mount time (trades=[], symbol='XAUUSD'). If trades arrive after mount but before the
  // chart finishes initializing, the 600ms timeout fires with empty trades and no lines draw.
  // Refs update on every render synchronously — no stale-closure risk.
  const tradesRef = useRef(trades);
  tradesRef.current = trades;
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;
  const onSymbolChangeRef = useRef(onSymbolChange);
  onSymbolChangeRef.current = onSymbolChange;
  // Gate: prevents useEffect([trades, symbol, isChartReady]) from syncing before the initial
  // 600ms TV-settle delay completes. Without this gate, the effect fires immediately on
  // isChartReady transition (TV still mid-load after widget.load()) and createShape returns null.
  const initialSyncDoneRef = useRef(false);
  
  const [isChartReady, setIsChartReady] = useState(false);
  const chartReadyRef = useRef(false);
  const [targetPrice, setTargetPrice] = useState(0);
  const [feedStatus, setFeedStatus] = useState({ status: 'connecting' });

  // ─── SMOOTH INTERPOLATION ──────────────────────────────────────────────────
  const displayPrice = useInterpolation(targetPrice, 0.2);

  // Sync interpolated price to manager for smooth SL/TP/PnL label updates
  useEffect(() => {
    if (isChartReady && managerRef.current) {
      //Sanket v2.0 - Only use interpolated price for trade line labels, NOT for TV candle updates.
      // Pushing candles at 60fps via requestAnimationFrame overwhelms TV's bar queue and freezes the chart.
      // TV candles are driven exclusively by real tick data via handlePriceUpdate in datafeed.js.
      managerRef.current.updateLivePrice(symbol, displayPrice);
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  // ─── BACKEND PERSISTENCE LOGIC ────────────────────────────────────────────
  
  const saveChartToBackend = useCallback(async () => {
    const userId = getUserId();
    const headers = getAuthHeaders();
    if (!userId || !headers || !widgetRef.current || !chartReadyRef.current) return;

    try {
      widgetRef.current.save((layoutJson) => {
        //Sanket v2.0 - Strip 'sources' (price line shapes) from saved layout.
        // Managed SL/TP/entry shapes have dynamic TV IDs that become stale on next session.
        // Loading stale shape IDs causes TV schema errors and "Can't find source" floods.
        // Trade lines are always re-created fresh by TradeLineManager on chart ready.
        try {
          if (layoutJson?.charts) {
            layoutJson.charts.forEach(chart => {
              if (chart.panes) {
                chart.panes.forEach(pane => {
                  if (pane.sources) {
                    pane.sources = pane.sources.filter(s =>
                      s.type !== 'HorzLine' && s.type !== 'PriceLine'
                    );
                  }
                });
              }
            });
          }
        } catch (e) {}

        fetch(`${API_URL}/chart/save`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            symbol: 'GLOBAL',
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

  const resetLegacyLayout = useCallback(async (headers) => {
    try {
      await fetch(`${API_URL}/chart/reset?symbol=GLOBAL`, {
        method: 'DELETE',
        headers
      });
    } catch {}
  }, []);

  const loadChartFromBackend = async (widget) => {
    const userId = getUserId();
    const headers = getAuthHeaders();
    if (!userId || !headers) return;

    try {
      const res = await fetch(`${API_URL}/chart/load?symbol=GLOBAL`, { headers });
      const data = await res.json();
      
      if (data.success && data.layoutJson) {
        if (Number(data.layoutVersion || 1) !== CHART_LAYOUT_VERSION) {
          await resetLegacyLayout(headers);
          return;
        }

        //Sanket v2.0 - Strip stale price line sources from saved layout before loading.
        // Old sessions may have baked-in HorzLine/PriceLine shapes with dead IDs → schema errors on load.
        try {
          const layout = data.layoutJson;
          if (layout?.charts) {
            layout.charts.forEach(chart => {
              if (chart.panes) {
                chart.panes.forEach(pane => {
                  if (pane.sources) {
                    pane.sources = pane.sources.filter(s =>
                      s.type !== 'HorzLine' && s.type !== 'PriceLine'
                    );
                  }
                });
              }
            });
          }
          widget.load(layout);
        } catch (e) {
          await resetLegacyLayout(headers);
        }
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
          if (sym && onSymbolChangeRef.current) onSymbolChangeRef.current(sym);
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
        //Sanket v2.0 - Delay initial syncTrades by 600ms. widget.load() causes TV to internally
        // re-process the chart layout. createShape called during this window returns null because
        // TV is still applying the layout state. The 600ms delay lets TV finish before we create
        // any managed shapes.
        // IMPORTANT: Read from tradesRef/symbolRef (not stale closure). The onChartReady callback
        // is inside useEffect([]) so trades/symbol captured here are the MOUNT-TIME values (empty
        // array). tradesRef.current is updated every render — always holds the latest trades.
        initialSyncDoneRef.current = false;
        setTimeout(() => {
          if (managerRef.current) {
            managerRef.current.syncTrades(tradesRef.current, symbolRef.current);
            initialSyncDoneRef.current = true; // Unlock subsequent useEffect syncs
          }
        }, 600);

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
  // Sanket v2.0 - Added isChartReady as dep so this fires when chart becomes ready with
  // already-loaded trades (handles the race where trades arrive before onChartReady fires).
  // initialSyncDoneRef gate prevents premature sync before the 600ms TV-settle delay completes.
  useEffect(() => {
    if (!managerRef.current || !isChartReady) return;
    managerRef.current.setAdminSpreads(adminSpreads);
    //Sanket v2.0 - Chart always uses MID price; order-panel BUY/SELL toggle must not shift candle prices
    Datafeed.setChartPriceSide('MID');
    if (!initialSyncDoneRef.current) return; // Wait for 600ms initial sync to complete first
    managerRef.current.syncTrades(trades, symbol);
  }, [adminSpreads, trades, symbol, isChartReady, selectedSide]);

  // ─── Live price stream listener ───────────────────────────────────────────
  useEffect(() => {
    const handlePriceUpdate = (e) => {
      //Sanket v2.0 - Normalize both sides so XAUUSD.i matches XAUUSD tick events
      const tickSymbol = String(e.detail?.symbol || '').toUpperCase().replace(/\.I$/i, '');
      const chartSymbol = String(symbol || '').toUpperCase().replace(/\.I$/i, '');
      if (tickSymbol === chartSymbol) {
        const { bid, ask } = e.detail;
        setTargetPrice({ bid, ask });
      }
    };
    const priceEvents = getPriceEvents();
    priceEvents.addEventListener('priceUpdate', handlePriceUpdate);
    return () => {
      priceEvents.removeEventListener("priceUpdate", handlePriceUpdate);
    };
  }, [symbol]);

  useEffect(() => {
    const priceEvents = getPriceEvents();
    const handleFeedStatus = (e) => {
      const detail = e.detail || {};
      const detailSymbol = normalizeSymbol(detail.symbol || '');
      if (!detailSymbol || detailSymbol !== normalizeSymbol(symbol)) return;
      setFeedStatus(detail);
    };

    priceEvents.addEventListener('chartFeedStatus', handleFeedStatus);
    const initialStatus = Datafeed.getFeedStatus(symbol);
    if (initialStatus) {
      setFeedStatus(initialStatus);
    } else {
      setFeedStatus({ status: 'connecting', symbol: normalizeSymbol(symbol) });
    }

    return () => {
      priceEvents.removeEventListener('chartFeedStatus', handleFeedStatus);
    };
  }, [symbol]);

  const statusPalette = {
    live: { label: 'Live feed', bg: 'rgba(16, 185, 129, 0.14)', color: '#10b981', border: 'rgba(16, 185, 129, 0.34)' },
    stale: { label: 'Feed stale', bg: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.34)' },
    reconnecting: { label: 'Reconnecting', bg: 'rgba(59, 130, 246, 0.14)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.34)' },
    degraded: { label: 'Feed degraded', bg: 'rgba(239, 68, 68, 0.14)', color: '#f87171', border: 'rgba(248, 113, 113, 0.34)' },
    connecting: { label: 'Connecting', bg: 'rgba(148, 163, 184, 0.14)', color: '#cbd5e1', border: 'rgba(203, 213, 225, 0.28)' },
    disconnected: { label: 'Disconnected', bg: 'rgba(148, 163, 184, 0.14)', color: '#cbd5e1', border: 'rgba(203, 213, 225, 0.28)' }
  };
  const feedBadge = statusPalette[feedStatus?.status] || statusPalette.connecting;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#0d0d0d"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 4,
          padding: "6px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.02em",
          background: feedBadge.bg,
          color: feedBadge.color,
          border: `1px solid ${feedBadge.border}`,
          backdropFilter: "blur(10px)"
        }}
      >
        {feedBadge.label}
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0d0d0d"
        }}
      />
    </div>
  );
};

export default Advance_Trading_View_Chart;
