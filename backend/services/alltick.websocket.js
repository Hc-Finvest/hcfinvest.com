import WebSocket from "ws";

export const startAllTickStream = (symbol, onTick) => {
  const ws = new WebSocket(
    `${process.env.ALLTICK_WS_URL}?apikey=${process.env.ALLTICK_API_KEY}`
  );

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        action: "subscribe",
        symbol,
      })
    );
  });

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    onTick(data);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });

  return ws;
};