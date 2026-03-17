import axios from "axios";

const BASE_URL = "https://api.alltick.com";
const API_KEY = "5645674e2fb395bada6cf2f00e42a5c9-c-app";

export const getHistoricalCandles = async (symbol, interval, from, to) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/v1/crypto/candles`,
      {
        params: {
          symbol,
          interval,
          from,
          to,
          apikey: API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("AllTick Error:", error.response?.data);
    throw error;
  }
};