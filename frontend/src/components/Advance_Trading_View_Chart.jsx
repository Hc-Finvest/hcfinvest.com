// import { useEffect, useRef } from "react";
// import Datafeed from "../services/datafeed.js";

// export default function Advance_Trading_View_Chart() {

//   const containerRef = useRef(null);
//   const widgetRef = useRef(null);

//   useEffect(() => {

//     if (!containerRef.current) return;

//     if (widgetRef.current) return; // prevent double init

//     widgetRef.current = new window.TradingView.widget({
//       symbol: "XAUUSD",
//       interval: "1",
//       container: containerRef.current, // 🔥 USE container NOT container_id
//       datafeed: Datafeed,
//       library_path: "/charting_library/",
//       locale: "en",
//       autosize: true,
//     });

//     return () => {
//       if (widgetRef.current) {
//         widgetRef.current.remove();
//         widgetRef.current = null;
//       }
//     };

//   }, []);

//   return (
//     <div
//       ref={containerRef}
//       style={{ height: "600px", width: "100%" }}
//     />
//   );
// }

import { useEffect, useRef } from "react";
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
