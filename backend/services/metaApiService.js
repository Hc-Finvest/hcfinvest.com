/**
* MetaAPI Market Data Service
* Streams real-time forex, metals, crypto, and indices prices via MetaAPI
* Organized by categories for frontend display
*/

import dotenv from 'dotenv'

dotenv.config()

// Price decimal configuration per symbol type
const getDecimals = (symbol) => {
  if (symbol.includes('JPY')) return 3
  if (symbol.includes('XAU')) return 2
  if (symbol.includes('XAG')) return 3
  if (symbol.includes('BTC')) return 2
  if (symbol.includes('ETH')) return 2
  if (['US30', 'US500', 'US100', 'UK100', 'GER40', 'JP225', 'US30.i', 'US500.i', 'US100.i', 'UK100.i', 'GER40.i', 'JP225.i'].includes(symbol)) return 1
  return 5 // Default for forex
}

const roundPrice = (price, decimals) => {
  const multiplier = Math.pow(10, decimals)
  return Math.round(price * multiplier) / multiplier
}

// MetaAPI Configuration
//Sanket - "Read MetaAPI credentials strictly from environment for production safety."
const METAAPI_TOKEN = () => process.env.METAAPI_TOKEN || ''
//Sanket - "Read MetaAPI account id strictly from environment for production safety."
const METAAPI_ACCOUNT_ID = () => process.env.METAAPI_ACCOUNT_ID || ''
// Region can be: london, new-york, singapore, etc. Default to new-york
const METAAPI_REGION = () => process.env.METAAPI_REGION || 'new-york'
const METAAPI_BASE_URL = () => `https://mt-client-api-v1.${METAAPI_REGION()}.agiliumtrade.ai`
const METAAPI_MARKET_DATA_URL = () => `https://mt-market-data-client-api-v1.${METAAPI_REGION()}.agiliumtrade.ai`

// Symbol Categories with display names
const SYMBOL_CATEGORIES = {
  Forex: {
    name: 'Forex',
    description: 'Currency Pairs',
    symbols: [
      { symbol: 'EURUSD', name: 'EUR/USD', displayName: 'Euro / US Dollar' },
      { symbol: 'GBPUSD', name: 'GBP/USD', displayName: 'British Pound / US Dollar' },
      { symbol: 'USDJPY', name: 'USD/JPY', displayName: 'US Dollar / Japanese Yen' },
      { symbol: 'USDCHF', name: 'USD/CHF', displayName: 'US Dollar / Swiss Franc' },
      { symbol: 'AUDUSD', name: 'AUD/USD', displayName: 'Australian Dollar / US Dollar' },
      { symbol: 'NZDUSD', name: 'NZD/USD', displayName: 'New Zealand Dollar / US Dollar' },
      { symbol: 'USDCAD', name: 'USD/CAD', displayName: 'US Dollar / Canadian Dollar' },
      { symbol: 'EURGBP', name: 'EUR/GBP', displayName: 'Euro / British Pound' },
      { symbol: 'EURJPY', name: 'EUR/JPY', displayName: 'Euro / Japanese Yen' },
      { symbol: 'GBPJPY', name: 'GBP/JPY', displayName: 'British Pound / Japanese Yen' },
      { symbol: 'EURAUD', name: 'EUR/AUD', displayName: 'Euro / Australian Dollar' },
      { symbol: 'EURCAD', name: 'EUR/CAD', displayName: 'Euro / Canadian Dollar' },
      { symbol: 'EURCHF', name: 'EUR/CHF', displayName: 'Euro / Swiss Franc' },
      { symbol: 'AUDJPY', name: 'AUD/JPY', displayName: 'Australian Dollar / Japanese Yen' },
      { symbol: 'CADJPY', name: 'CAD/JPY', displayName: 'Canadian Dollar / Japanese Yen' },
      { symbol: 'CHFJPY', name: 'CHF/JPY', displayName: 'Swiss Franc / Japanese Yen' },
      { symbol: 'AUDNZD', name: 'AUD/NZD', displayName: 'Australian Dollar / New Zealand Dollar' },
      { symbol: 'AUDCAD', name: 'AUD/CAD', displayName: 'Australian Dollar / Canadian Dollar' },
      { symbol: 'CADCHF', name: 'CAD/CHF', displayName: 'Canadian Dollar / Swiss Franc' },
      { symbol: 'NZDJPY', name: 'NZD/JPY', displayName: 'New Zealand Dollar / Japanese Yen' },
      { symbol: 'GBPAUD', name: 'GBP/AUD', displayName: 'British Pound / Australian Dollar' },
      { symbol: 'GBPCAD', name: 'GBP/CAD', displayName: 'British Pound / Canadian Dollar' },
      { symbol: 'GBPCHF', name: 'GBP/CHF', displayName: 'British Pound / Swiss Franc' },
      { symbol: 'GBPNZD', name: 'GBP/NZD', displayName: 'British Pound / New Zealand Dollar' },
      { symbol: 'AUDCHF', name: 'AUD/CHF', displayName: 'Australian Dollar / Swiss Franc' },
      { symbol: 'NZDCAD', name: 'NZD/CAD', displayName: 'New Zealand Dollar / Canadian Dollar' },
      { symbol: 'NZDCHF', name: 'NZD/CHF', displayName: 'New Zealand Dollar / Swiss Franc' },
      { symbol: 'EURNZD', name: 'EUR/NZD', displayName: 'Euro / New Zealand Dollar' }
    ]
  },
  Metals: {
    name: 'Metals',
    description: 'Precious Metals & Commodities',
    symbols: [
      { symbol: 'XAUUSD.i', name: 'XAU/USD', displayName: 'Gold / US Dollar' },
      { symbol: 'XAGUSD.i', name: 'XAG/USD', displayName: 'Silver / US Dollar' },
      { symbol: 'XPTUSD.i', name: 'XPT/USD', displayName: 'Platinum / US Dollar' },
      { symbol: 'XPDUSD.i', name: 'XPD/USD', displayName: 'Palladium / US Dollar' },
      { symbol: 'USOIL.i', name: 'US Oil', displayName: 'WTI Crude Oil' },
      { symbol: 'UKOIL.i', name: 'UK Oil', displayName: 'Brent Crude Oil' },
      { symbol: 'NGAS.i', name: 'Natural Gas', displayName: 'Natural Gas' },
      { symbol: 'COPPER.i', name: 'Copper', displayName: 'Copper' }
    ]
  },
  Crypto: {
    name: 'Crypto',
    description: 'Cryptocurrencies',
    symbols: [
      { symbol: 'BTCUSD.i', name: 'BTC/USD', displayName: 'Bitcoin / US Dollar' },
      { symbol: 'ETHUSD.i', name: 'ETH/USD', displayName: 'Ethereum / US Dollar' },
      { symbol: 'LTCUSD.i', name: 'LTC/USD', displayName: 'Litecoin / US Dollar' },
      { symbol: 'XRPUSD.i', name: 'XRP/USD', displayName: 'Ripple / US Dollar' },
      { symbol: 'BNBUSD.i', name: 'BNB/USD', displayName: 'Binance Coin / US Dollar' },
      { symbol: 'SOLUSD.i', name: 'SOL/USD', displayName: 'Solana / US Dollar' },
      { symbol: 'ADAUSD.i', name: 'ADA/USD', displayName: 'Cardano / US Dollar' },
      { symbol: 'DOGEUSD.i', name: 'DOGE/USD', displayName: 'Dogecoin / US Dollar' },
      { symbol: 'DOTUSD.i', name: 'DOT/USD', displayName: 'Polkadot / US Dollar' },
      { symbol: 'MATICUSD.i', name: 'MATIC/USD', displayName: 'Polygon / US Dollar' },
      { symbol: 'AVAXUSD.i', name: 'AVAX/USD', displayName: 'Avalanche / US Dollar' },
      { symbol: 'LINKUSD.i', name: 'LINK/USD', displayName: 'Chainlink / US Dollar' },
      { symbol: 'UNIUSD.i', name: 'UNI/USD', displayName: 'Uniswap / US Dollar' },
      { symbol: 'ATOMUSD.i', name: 'ATOM/USD', displayName: 'Cosmos / US Dollar' },
      { symbol: 'XLMUSD.i', name: 'XLM/USD', displayName: 'Stellar / US Dollar' },
      { symbol: 'TRXUSD.i', name: 'TRX/USD', displayName: 'Tron / US Dollar' },
      { symbol: 'ETCUSD.i', name: 'ETC/USD', displayName: 'Ethereum Classic / US Dollar' },
      { symbol: 'NEARUSD.i', name: 'NEAR/USD', displayName: 'Near Protocol / US Dollar' },
      { symbol: 'ALGOUSD.i', name: 'ALGO/USD', displayName: 'Algorand / US Dollar' }
    ]
  },
  Indices: {
    name: 'Indices',
    description: 'Stock Market Indices',
    symbols: [
      { symbol: 'US30.i', name: 'US30', displayName: 'Dow Jones Industrial Average' },
      { symbol: 'US500.i', name: 'US500', displayName: 'S&P 500' },
      { symbol: 'US100.i', name: 'US100', displayName: 'NASDAQ 100' },
      { symbol: 'UK100.i', name: 'UK100', displayName: 'FTSE 100' },
      { symbol: 'GER40.i', name: 'GER40', displayName: 'DAX 40' },
      { symbol: 'FRA40.i', name: 'FRA40', displayName: 'CAC 40' },
      { symbol: 'JP225.i', name: 'JP225', displayName: 'Nikkei 225' },
      { symbol: 'HK50.i', name: 'HK50', displayName: 'Hang Seng 50' },
      { symbol: 'AUS200.i', name: 'AUS200', displayName: 'ASX 200' }
    ]
  }
}

// Build flat symbol list and reverse lookup
const ALL_SYMBOLS = []
const SYMBOL_INFO = {}
const SYMBOL_TO_CATEGORY = {}

Object.entries(SYMBOL_CATEGORIES).forEach(([category, data]) => {
  data.symbols.forEach(sym => {
    ALL_SYMBOLS.push(sym.symbol)
    SYMBOL_INFO[sym.symbol] = { ...sym, category }
    SYMBOL_TO_CATEGORY[sym.symbol] = category
  })
})

// Symbols that actually work on this MetaAPI account
// Complete list of 377 available symbols
const WORKING_SYMBOLS = [
  'AAL', 'AALB', 'ABDN', 'ABF', 'ABN', 'AC', 'ACA', 'ADAUSD.i', 'ADPR', 'ADS', 'ADYEN', 'AENA', 'AFX', 'AGN', 'AI', 'AIR', 'AKZA', 'ALGUSD.i', 'ALV', 'AMS', 'AMUN', 'ANA', 'ANTO', 'ASM', 'ASML', 'ASRNL', 'ATMUSD.i', 'ATOS', 'AUDCAD.i', 'AUDCHF.i', 'AUDJPY.i', 'AUDNZD.i', 'AUDUSD', 'AUDUSD.i', 'AUS200.i', 'AUTO', 'AVAUSD.i', 'AVIVA', 'AZN', 'BAE', 'BARC', 'BAS', 'BATS', 'BATUSD.i', 'BAYN', 'BBVA', 'BEI', 'BKG', 'BLND', 'BMW', 'BN', 'BNBUSD.i', 'BNP', 'BNR', 'BNZL', 'BP', 'BRBY', 'BT.A', 'BTCEUR.i', 'BTCUSD.crp', 'BTCUSD.i', 'BTCXBN.i', 'BTCXET.i', 'BTCXLC.i', 'BVSPX.i', 'CA', 'CABK', 'CADCHF.i', 'CADJPY.i', 'CAP', 'CBK', 'CCH', 'CCL', 'CDI', 'CHFJPY.i', 'CHINA50.i', 'CL-OIL.i', 'CLNX', 'CNA', 'CON', 'CPG', 'CRDA', 'CRH', 'CRVUSD.i', 'CS', 'Cocoa.i', 'Coffee.i', 'DAST', 'DB1', 'DBK', 'DCC', 'DG', 'DHER', 'DHL', 'DIAGEO', 'DIM', 'DJ30ft.i', 'DOGUSD.i', 'DOTUSD.i', 'DWNI', 'DWS', 'EL', 'ELE', 'EN', 'ENGI', 'ENT', 'EOAN', 'ESP35.i', 'ETCUSD.i', 'EUB10Y.i', 'EUB2Y.i', 'EUB30Y.i', 'EUB5Y.i', 'EURAUD.i', 'EURCAD.i', 'EURCHF.i', 'EURGBP.i', 'EURHUF.i', 'EURIBOR3M.i', 'EURJPY.i', 'EURMXN.i', 'EURNOK.i', 'EURNZD.i', 'EURSEK.i', 'EURSGD.i', 'EURTRY.i', 'EURUSD', 'EURUSD.i', 'EURZAR.i', 'EUSTX50.i', 'EXPN', 'EZJ', 'FIE', 'FILUSD.i', 'FLTR', 'FME', 'FP', 'FRA', 'FRA40.i', 'FRAS', 'FRE', 'FRES', 'G24', 'GALP', 'GAUUSD.i', 'GBPAUD.i', 'GBPCAD.i', 'GBPCHF.i', 'GBPJPY.i', 'GBPNOK.i', 'GBPNZD.i', 'GBPUSD', 'GBPUSD.i', 'GBXUSD', 'GER40.i', 'GER40ft.i', 'GLE', 'GLEN', 'GLPG', 'GOLDft.i', 'GRTUSD.i', 'GSK', 'HEI', 'HEIA', 'HEN3', 'HIK', 'HK50ft.i', 'HKG33.i', 'HLAG', 'HLMA', 'HNR1', 'HOT', 'HRMS', 'HSBA', 'HSX', 'IBE', 'IFX', 'IHG', 'III', 'IMB', 'IMCD', 'INCUSD.i', 'INF', 'INGA', 'IOTUSD.i', 'ITRK', 'ITV', 'ITX', 'JDI', 'JMAT', 'JPN225.i', 'JPN225ft.i', 'KAUUSD.i', 'KBX', 'KER', 'KGF', 'KGX', 'KRN', 'LAND', 'LEG', 'LGEN', 'LLOY', 'LNKUSD.i', 'LR', 'LRCUSD.i', 'LSEG', 'LVMH', 'LongGilt.i', 'MAP', 'MBG', 'ML', 'MNDI', 'MNG', 'MRCK', 'MT', 'MTX', 'MUV2', 'NAS100.i', 'NAS100ft.i', 'NEMD', 'NEOUSD.i', 'NERUSD.i', 'NG.i', 'NGRID', 'NN', 'NWG', 'NXT', 'NZDCAD.i', 'NZDCHF.i', 'NZDJPY.i', 'NZDUSD', 'NZDUSD.i', 'OCDO', 'ONEUSD.i', 'OR', 'PHIA', 'PRU', 'PRX', 'PSH', 'PSN', 'PSON', 'PUBP', 'PUM', 'RAA', 'RAND', 'RB', 'RELX', 'REP', 'RI', 'RIO', 'RMV', 'RNO', 'RR', 'RRTL', 'RTO', 'RWE', 'SAB', 'SAF', 'SANTANDER', 'SANUSD.i', 'SAP', 'SBRY', 'SDR', 'SGE', 'SGO', 'SGRO', 'SHBUSD.i', 'SHELL', 'SHL', 'SIE', 'SILVERft.i', 'SMIN', 'SMT', 'SN', 'SOLUSD.i', 'SON', 'SP500ft.i', 'SPX', 'SPX500.i', 'SRT3', 'SSE', 'STAN', 'STJ', 'STM', 'SU', 'SUSUSD.i', 'SVT', 'SW', 'SWR', 'SY1', 'TCFP', 'TEF', 'TESCO', 'TLX', 'TRST', 'TRXUSD.i', 'TW', 'UK100.i', 'UK100ft.i', 'UKOUSD.i', 'UKOUSDft.i', 'ULVR', 'UNA', 'UNIUSD.i', 'URW', 'US2000.i', 'US30.i', 'USDBRL.i', 'USDCAD.i', 'USDCHF-EXC', 'USDCHF-EXC.i', 'USDCHF.i', 'USDCLP.i', 'USDCNH.i', 'USDCOP.i', 'USDHKD', 'USDHKD.i', 'USDHUF.i', 'USDIDR.i', 'USDINR.i', 'USDJPY', 'USDJPY.i', 'USDKRW.i', 'USDMXN.i', 'USDNGN', 'USDNGN.i', 'USDNOK.i', 'USDRUB.i', 'USDSEK.i', 'USDSGD', 'USDSGD.i', 'USDTHB.i', 'USDTRY.i', 'USDTWD.i', 'USDX.i', 'USDZAR', 'USDZAR.i', 'USNote10Y.i', 'USOUSD.i', 'UTDI', 'UU', 'VIE', 'VIS', 'VIV', 'VIX.i', 'VNA', 'VOD', 'VOW', 'VPK', 'WKL', 'WPP', 'WTB', 'Wheat.i', 'XAGUSD.i', 'XAUAUD.i', 'XAUCHF.i', 'XAUEUR.i', 'XAUGBP.i', 'XAUJPY.i', 'XAUUSD.crp', 'XAUUSD.i', 'XBNUSD.crp', 'XBNUSD.i', 'XETEUR.i', 'XETUSD.crp', 'XETUSD.i', 'XETXBN.i', 'XETXLC.i', 'XLCUSD.crp', 'XLCUSD.i', 'XLMUSD.i', 'XPDUSD.i', 'XPTUSD.i', 'XRPUSD.i', 'XTZUSD.i', 'ZAL', 'ZECUSD.i'
]

// Symbols shown in frontend trade page instrument list.
const FRONTEND_TRADE_SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD', 'EURGBP', 'EURJPY', 'GBPJPY',
  'EURAUD', 'EURCAD', 'EURCHF', 'AUDJPY', 'CADJPY', 'CHFJPY', 'AUDNZD', 'AUDCAD', 'CADCHF', 'NZDJPY',
  'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD', 'AUDCHF', 'NZDCAD', 'NZDCHF', 'EURNZD',
  'XAUUSD.i', 'XAGUSD.i', 'USOIL.i', 'UKOIL.i', 'NGAS.i',
  'BTCUSD.i', 'ETHUSD.i', 'BNBUSD.i', 'SOLUSD.i', 'DOGEUSD.i', 'LTCUSD.i',
  'US30.i', 'US500.i', 'US100.i', 'UK100.i', 'HK50.i'
]

const REQUESTED_TO_ACCOUNT_FALLBACKS = {
  USOILI: ['USOUSD.i', 'CL-OIL.i'],
  USOIL: ['USOUSD.i', 'CL-OIL.i'],
  UKOILI: ['UKOUSD.i', 'UKOUSDft.i'],
  UKOIL: ['UKOUSD.i', 'UKOUSDft.i'],
  NGASI: ['NG.i'],
  NGAS: ['NG.i'],
  US500I: ['SPX500.i', 'SP500ft.i', 'SPX'],
  US500: ['SPX500.i', 'SP500ft.i', 'SPX'],
  US100I: ['NAS100.i', 'NAS100ft.i'],
  US100: ['NAS100.i', 'NAS100ft.i'],
  USTEC: ['NAS100.i', 'NAS100ft.i'],
  HK50I: ['HKG33.i', 'HK50ft.i'],
  HK50: ['HKG33.i', 'HK50ft.i'],
  DOGEUSDI: ['DOGUSD.i'],
  DOGEUSD: ['DOGUSD.i'],
  ETHUSDI: ['XETUSD.i', 'XETUSD.crp'],
  ETHUSD: ['XETUSD.i', 'XETUSD.crp'],
  LTCUSDI: ['XLCUSD.i', 'XLCUSD.crp'],
  LTCUSD: ['XLCUSD.i', 'XLCUSD.crp']
}

const toKey = (symbol = '') => symbol.toUpperCase().replace(/[^A-Z0-9]/g, '')
const stripDotI = (symbol = '') => symbol.replace(/\.i$/i, '')

class MetaApiService {
  constructor() {
    this.prices = new Map()
    this.subscribers = new Set()
    this.isConnected = false
    this.pollInterval = null
    this.lastUpdate = null
    this.totalTicksReceived = 0
    this.lastError = null
    this.connectionStartTime = null
    this.rateLimitHits = 0
    this.rateLimitBackoff = 0
    this.consecutiveErrors = 0
    this.maxConsecutiveErrors = 5
    this.requestToActualMap = new Map()
    this.actualToRequestsMap = new Map()
    this.buildSymbolMappings()
  }

  resolveSymbolForAccount(requestedSymbol) {
    if (!requestedSymbol) return null

    if (WORKING_SYMBOLS.includes(requestedSymbol)) return requestedSymbol

    const requestedKey = toKey(requestedSymbol)
    const candidates = []

    if (REQUESTED_TO_ACCOUNT_FALLBACKS[requestedKey]) {
      candidates.push(...REQUESTED_TO_ACCOUNT_FALLBACKS[requestedKey])
    }

    if (!/\.i$/i.test(requestedSymbol)) {
      candidates.push(`${requestedSymbol}.i`)
    } else {
      candidates.push(stripDotI(requestedSymbol))
    }

    const base = stripDotI(requestedSymbol)
    const prefixMatches = WORKING_SYMBOLS.filter(s => {
      const sBase = stripDotI(s)
      return sBase === base || s.startsWith(`${base}-`) || s.startsWith(base)
    })
    candidates.push(...prefixMatches)

    const uniqueCandidates = [...new Set(candidates)]
    for (const candidate of uniqueCandidates) {
      if (WORKING_SYMBOLS.includes(candidate)) return candidate
    }

    return null
  }

  buildSymbolMappings() {
    this.requestToActualMap.clear()
    this.actualToRequestsMap.clear()

    for (const requested of FRONTEND_TRADE_SYMBOLS) {
      const actual = this.resolveSymbolForAccount(requested)
      if (!actual) continue

      this.requestToActualMap.set(requested, actual)
      if (!this.actualToRequestsMap.has(actual)) {
        this.actualToRequestsMap.set(actual, new Set())
      }
      this.actualToRequestsMap.get(actual).add(requested)
    }
  }

  /**
   * Get MetaAPI headers for authentication
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'auth-token': METAAPI_TOKEN()
    }
  }

  /**
   * Connect to MetaAPI and start price streaming
   * Uses real MetaAPI data with rate-limit-safe polling
   */
  async connect() {
    const token = METAAPI_TOKEN()
    const accountId = METAAPI_ACCOUNT_ID()

    if (!token || !accountId) {
      console.log('[MetaAPI] No credentials configured - cannot start real prices')
      return
    }

    console.log('[MetaAPI] Connecting to MetaAPI...')
    console.log(`[MetaAPI] Account ID: ${accountId.substring(0, 8)}...`)
    console.log(`[MetaAPI] Region: ${METAAPI_REGION()}`)

    // Test connection with a single symbol
    try {
      const response = await fetch(
        `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/EURUSD/current-price`,
        { headers: this.getHeaders() }
      )

      if (response.ok) {
        console.log('[MetaAPI] Connection successful - starting real-time polling')
        this.isConnected = true
        this.connectionStartTime = Date.now()
        this.startRateLimitSafePolling()
      } else if (response.status === 401) {
        console.error('[MetaAPI] Authentication failed - check METAAPI_TOKEN')
        return
      } else if (response.status === 404) {
        console.error('[MetaAPI] Account not found - check METAAPI_ACCOUNT_ID and METAAPI_REGION')
        return
      } else {
        console.error(`[MetaAPI] Connection failed with status ${response.status}`)
        return
      }
    } catch (error) {
      console.error('[MetaAPI] Connection error:', error.message)
      return
    }
  }

  /**
   * Enhanced polling strategy for MetaAPI
   * - Fetches key symbols from each category (Forex, Metals, Crypto, Indices)
   * - 15-20 symbols to get good market coverage while respecting rate limits
   * - 10-second interval between polling cycles with 2-second request delays
   * - Rate-limited: ~60 requests/minute from MetaAPI
   */
  startRateLimitSafePolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    // Poll symbols required by trade page, resolved to symbols that exist on this account.
    this.liveSymbols = [...new Set(
      FRONTEND_TRADE_SYMBOLS
        .map(symbol => this.requestToActualMap.get(symbol) || this.resolveSymbolForAccount(symbol))
        .filter(Boolean)
    )]

    console.log(`[MetaAPI] 🔴 Live polling: ${this.liveSymbols.length} symbols`)
    console.log(`[MetaAPI] Sample: ${this.liveSymbols.slice(0, 8).join(', ')}...`)

    // Increase interval for higher symbol count - 60+ symbols @ 2s each = 2min per cycle
    const pollIntervalMs = 120000 // 2 minutes between full polling cycles (avoid rate limits)

    // Initial fetch
    this.fetchLiveSymbols()

    this.pollInterval = setInterval(() => {
      this.fetchLiveSymbols()
    }, pollIntervalMs)
  }

  /**
   * Fetch only essential live symbols with generous delays
   */
  async fetchLiveSymbols() {
    const accountId = METAAPI_ACCOUNT_ID()
    if (!accountId) return

    for (const symbol of this.liveSymbols) {
      try {
        const response = await fetch(
          `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`,
          { headers: this.getHeaders() }
        )

        if (response.ok) {
          const price = await response.json()
          console.log(`[MetaAPI] Price update for ${symbol}: Bid ${price.bid}, Ask ${price.ask}`)
          this.updatePrice(price)
          this.totalTicksReceived++
        } else {
          const errorText = await response.text()
          console.error(`[MetaAPI] Poll failed for ${symbol}: ${response.status} - ${errorText}`)
          if (response.status === 429) {
            console.warn(`[MetaAPI] Rate limited on ${symbol} - skipping this cycle`)
            break
          }
        }
      } catch (e) {
        // Network error - continue with next symbol
      }

      // 2 second delay between requests (very conservative)
      await this.delay(2000)
    }

    this.lastUpdate = Date.now()
  }


  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Start polling prices at regular intervals
   */
  startPricePolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    // Initial fetch
    this.fetchAllPrices()

    // Poll every 1 second for real-time updates
    this.pollInterval = setInterval(() => {
      this.fetchAllPrices()
    }, 1000)

    console.log('[MetaAPI] Price polling started (1s interval)')
  }

  /**
   * Fetch prices for all symbols from MetaAPI
   * MetaAPI only supports fetching one symbol at a time, so we batch requests
   */
  async fetchAllPrices() {
    const accountId = METAAPI_ACCOUNT_ID()
    if (!accountId || !this.isConnected) return

    try {
      // Fetch prices in parallel batches to avoid rate limiting
      const batchSize = 10
      const batches = []

      for (let i = 0; i < ALL_SYMBOLS.length; i += batchSize) {
        batches.push(ALL_SYMBOLS.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const promises = batch.map(symbol => this.fetchSymbolPrice(accountId, symbol))
        await Promise.all(promises)
      }

      this.lastUpdate = Date.now()
      this.lastError = null

    } catch (error) {
      // Silent fail for polling - don't spam logs
      if (!this.lastError) {
        console.error('[MetaAPI] Price fetch error:', error.message)
        this.lastError = error.message
      }
    }
  }

  /**
   * Fetch price for a single symbol
   */
  async fetchSymbolPrice(accountId, symbol) {
    try {
      const response = await fetch(
        `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`,
        { headers: this.getHeaders() }
      )

      if (response.ok) {
        const price = await response.json()
        this.updatePrice(price)
        this.rateLimitHits = 0 // Reset on success
      } else if (response.status === 429) {
        // Rate limited - log warning
        this.rateLimitHits = (this.rateLimitHits || 0) + 1
        if (this.rateLimitHits === 1 || this.rateLimitHits % 10 === 0) {
          console.warn(`[MetaAPI] Rate limited (429) - ${this.rateLimitHits} consecutive hits for ${symbol}`)
        }
      }
    } catch (e) {
      // Skip failed symbols silently
    }
  }

  /**
   * Stop price polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  /**
   * Update price in cache and notify subscribers
   */
  updatePrice(priceData) {
    if (!priceData || !priceData.symbol) return

    const { symbol, bid, ask, time } = priceData

    if (!bid || !ask || bid <= 0 || ask <= 0) return

    // Round prices to correct decimal places
    const decimals = getDecimals(symbol)
    const roundedBid = roundPrice(parseFloat(bid), decimals)
    const roundedAsk = roundPrice(parseFloat(ask), decimals)

    const priceInfo = {
      bid: roundedBid,
      ask: roundedAsk,
      spread: roundPrice(roundedAsk - roundedBid, decimals),
      time: time ? new Date(time).getTime() : Date.now(),
      decimals: decimals,
      provider: 'metaapi',
      category: SYMBOL_TO_CATEGORY[symbol] || 'Other',
      ...SYMBOL_INFO[symbol]
    }

    this.prices.set(symbol, priceInfo)

    // Publish the same price under requested frontend symbols that map to this account symbol.
    const mappedRequestedSymbols = this.actualToRequestsMap.get(symbol)
    if (mappedRequestedSymbols) {
      mappedRequestedSymbols.forEach(requestedSymbol => {
        const requestedDecimals = getDecimals(requestedSymbol)
        const requestedPriceInfo = {
          ...priceInfo,
          bid: roundPrice(parseFloat(bid), requestedDecimals),
          ask: roundPrice(parseFloat(ask), requestedDecimals),
          spread: roundPrice(roundPrice(parseFloat(ask), requestedDecimals) - roundPrice(parseFloat(bid), requestedDecimals), requestedDecimals),
          decimals: requestedDecimals,
          category: SYMBOL_TO_CATEGORY[requestedSymbol] || priceInfo.category,
          ...(SYMBOL_INFO[requestedSymbol] || {}),
          symbol: requestedSymbol,
          mappedFrom: symbol
        }
        this.prices.set(requestedSymbol, requestedPriceInfo)
        this.notifySubscribers(requestedSymbol, requestedPriceInfo)
      })
    }

    this.totalTicksReceived++

    // Notify subscribers
    this.notifySubscribers(symbol, priceInfo)
  }

  /**
   * Disconnect and stop polling
   */
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isConnected = false
    this.subscribers.clear()
    console.log('[MetaAPI] Disconnected')
  }

  /**
   * Add a subscriber callback
   */
  addSubscriber(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of price update
   */
  notifySubscribers(symbol, priceData) {
    this.subscribers.forEach(callback => {
      try {
        callback(symbol, priceData)
      } catch (e) {
        console.error('[MetaAPI] Subscriber error:', e.message)
      }
    })
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol) {
    return this.prices.get(symbol) || null
  }

  /**
   * Get all current prices as object
   */
  getAllPrices() {
    return Object.fromEntries(this.prices)
  }

  /**
   * Get prices organized by category
   */
  getPricesByCategory() {
    const result = {}

    Object.entries(SYMBOL_CATEGORIES).forEach(([category, data]) => {
      result[category] = {
        name: data.name,
        description: data.description,
        symbols: data.symbols.map(sym => {
          const price = this.prices.get(sym.symbol)
          return {
            ...sym,
            bid: price?.bid || 0,
            ask: price?.ask || 0,
            spread: price?.spread || 0,
            time: price?.time || null,
            hasPrice: !!price
          }
        })
      }
    })

    return result
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols() {
    // Return only symbols that actually work on this account
    return [...WORKING_SYMBOLS]
  }

  /**
   * Get symbol categories configuration
   */
  getCategories() {
    return SYMBOL_CATEGORIES
  }

  /**
   * Get symbol info
   */
  getSymbolInfo(symbol) {
    if (SYMBOL_INFO[symbol]) return SYMBOL_INFO[symbol]

    const resolved = this.requestToActualMap.get(symbol) || this.resolveSymbolForAccount(symbol)
    return resolved ? (SYMBOL_INFO[resolved] || null) : null
  }

  /**
   * Check if symbol is supported
   */
  isSymbolSupported(symbol) {
    return WORKING_SYMBOLS.includes(symbol) || !!(this.requestToActualMap.get(symbol) || this.resolveSymbolForAccount(symbol))
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      provider: 'metaapi',
      mode: 'LIVE',
      liveSymbols: this.liveSymbols || [],
      liveSymbolCount: this.liveSymbols?.length || 0,
      symbolCount: this.prices.size,
      totalSymbols: ALL_SYMBOLS.length,
      totalTicks: this.totalTicksReceived,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
      lastUpdate: this.lastUpdate,
      lastError: this.lastError
    }
  }

  /**
   * Fetch historical OHLC candles from MetaAPI
   * @param {string} symbol - Trading symbol (e.g., 'XAUUSD')
   * @param {string} timeframe - Timeframe: '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1mn'
   * @param {number} startTime - Start timestamp in seconds
   * @param {number} endTime - End timestamp in seconds (optional, defaults to now)
   * @param {number} limit - Max number of candles (default 500, max 1000)
   * @returns {Promise<Array>} Array of candle objects { time, open, high, low, close, volume }
   */
  async getHistoricalCandles(symbol, timeframe = '1m', startTime, endTime, limit = 500) {
    const accountId = METAAPI_ACCOUNT_ID()
    const token = METAAPI_TOKEN()

    // Map timeframe to MetaAPI format
    const timeframeMap = {
      '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
      '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w', '1M': '1mn'
    }
    const metaTimeframe = timeframeMap[timeframe] || '1m'

    // If no credentials, return empty (no simulation)
    if (!accountId || !token) {
      return []
    }

    try {
      const baseUrl = `${METAAPI_MARKET_DATA_URL()}/users/current/accounts/${accountId}/historical-market-data/symbols/${symbol}/timeframes/${metaTimeframe}/candles`

      const timeframeSecondsMap = {
        '1m': 60,
        '5m': 5 * 60,
        '15m': 15 * 60,
        '30m': 30 * 60,
        '1h': 60 * 60,
        '4h': 4 * 60 * 60,
        '1d': 24 * 60 * 60,
        '1w': 7 * 24 * 60 * 60,
        '1M': 30 * 24 * 60 * 60
      }

      const tfSeconds = timeframeSecondsMap[timeframe] || 60
      const hasBoundedWindow = Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime
      const anchorTimeSec = Number.isFinite(endTime)
        ? endTime
        : Number.isFinite(startTime)
          ? startTime
          : Math.floor(Date.now() / 1000)

      //Sanket - "MetaAPI candles endpoint is anchor-based, so request up to anchor and filter by requested bounds."
      const requiredByWindow = hasBoundedWindow
        ? Math.ceil((endTime - startTime) / tfSeconds) + 5
        : 0
      const effectiveLimit = Math.min(1000, Math.max(limit || 500, requiredByWindow || 0, 1))

      const params = new URLSearchParams()
      params.append('startTime', new Date(anchorTimeSec * 1000).toISOString())
      params.append('limit', effectiveLimit)
      const primaryUrl = `${baseUrl}?${params.toString()}`

      let response = await fetch(primaryUrl, { headers: this.getHeaders() })

      //Sanket - "Retry with limit-only when provider rejects anchored query shape with HTTP 400."
      if (!response.ok && response.status === 400) {
        const fallbackParams = new URLSearchParams()
        fallbackParams.append('limit', effectiveLimit)
        response = await fetch(`${baseUrl}?${fallbackParams.toString()}`, { headers: this.getHeaders() })
      }

      if (!response.ok) {
        console.warn(`[MetaAPI] ⚠️ Historical candles failed for ${symbol}: HTTP ${response.status}`)
        return []
      }

      const data = await response.json()
      // console.log(`[MetaAPI] History fetched for ${symbol}: ${data?.length || 0} candles`)

      // Transform MetaAPI candle format to lightweight-charts format
      const candles = (data || []).map(c => ({
        time: Math.floor(new Date(c.time).getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume || c.volume || 0
      }))

      // Sort by time ascending
      candles.sort((a, b) => a.time - b.time)

      //Sanket - "Trim provider candles to the exact window requested by chart."
      const filtered = candles.filter(c => {
        if (Number.isFinite(startTime) && c.time < startTime) return false
        if (Number.isFinite(endTime) && c.time > endTime) return false
        return true
      })

      return filtered
    } catch (error) {
      console.error(`[MetaAPI] Historical candles error for ${symbol}:`, error.message)
      // Return empty instead of simulated candles
      return []
    }
  }


  /**
   * Get default price for a symbol (used in simulation)
   */
  getDefaultPrice(symbol) {
    const defaults = {
      EURUSD: 1.0320, GBPUSD: 1.2380, USDJPY: 151.80, USDCHF: 0.9120,
      AUDUSD: 0.6280, NZDUSD: 0.5680, USDCAD: 1.4320,
      XAUUSD: 2950, XAGUSD: 32.50, BTCUSD: 97500, ETHUSD: 2720,
      US30: 44350, US500: 6080, US100: 21650
    }
    return defaults[symbol] || 1.0
  }

  /**
   * Round price to appropriate decimals for symbol
   */
  roundToDecimals(price, symbol) {
    const decimals = getDecimals(symbol)
    return roundPrice(price, decimals)
  }
}

// Singleton instance
const metaApiService = new MetaApiService()

export default metaApiService
export { SYMBOL_CATEGORIES, ALL_SYMBOLS, SYMBOL_INFO }
