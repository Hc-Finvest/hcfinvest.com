import ForexSpread from "./ForexSpread.js";
import MetalsSpread from "./MetalsSpread.js";
import IndicesSpread from "./IndicesSpread.js";
import StocksSpread from "./StocksSpread.js";
import CommoditiesSpread from "./CommoditiesSpread.js";
import CryptoSpread from "./CryptoSpread.js";

export const marketModelMap = {
  Forex: ForexSpread,
  Metals: MetalsSpread,
  Indices: IndicesSpread,
  Stocks: StocksSpread,
  Commodities: CommoditiesSpread,
  Cryptocurrencies: CryptoSpread,
};
