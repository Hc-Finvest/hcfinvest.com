
import React, { useEffect, useRef } from "react";
import Datafeed from "../services/datafeed.js";

const Advance_Trading_View_Chart = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const widget = new window.TradingView.widget({
      symbol: "XAUUSD",
      interval: "1",
      container: containerRef.current,
      library_path: "/charting_library/",
      locale: "en",
      theme: "dark",
      autosize: true,
      datafeed: Datafeed,
    });

    return () => widget.remove();
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "600px" }} />;
};

export default Advance_Trading_View_Chart;
