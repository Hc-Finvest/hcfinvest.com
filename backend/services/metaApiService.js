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
const METAAPI_TOKEN = () => process.env.METAAPI_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiXSwicmVzb3VyY2VzIjpbImFjY291bnQ6JFVTRVJfSUQkOmI2NjhiOWI4LTU5NGUtNDc4OS1hODdkLTE1ODYwNDBkMDg0ZCJdfSx7ImlkIjoibWV0YWFwaS1yZXN0LWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19LHsiaWQiOiJtZXRhYXBpLXJwYy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFzdGF0cy1hcGkiLCJtZXRob2RzIjpbIm1ldGFzdGF0cy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImlhdCI6MTc3MDYzNTE4OX0.OtP0Fw4z0HzLKRqfasbRM3XvdquMBROjRD75QNqVfhMby1610fAlb95yG7H8WX_EhxFUXFVTEXOOCPumDCeCpFI0NAL-eGOiA6CgbXAPB5RjB95qCPamzub6MaK8c-ZWlkntrRekQgVu-vtYUsaTvC-1ZKY9Qcv4X4o7kesbiF373EXGdDyHD59i3p3FVkaVBT424jN8tA-qbBq7DPO6I_78P3U-Xg5tEQasam6LKG9UkJtMwi8CZMhL8Xtx63gb1phc0egXUhZQtfwyg7hQvdwFfV2fU8-vnVjZ_oq2kV8vg5Jk1mtyslfUmdHWeUJTFQ5QNWA5w1NDqwECsofPvGPqRMQmUOw6FQEpc9NpsRazOQ9Y_1c2FPGanrA-AbLopd8DpOCuok6LCFCWAtytkIyset9QTH6qMQyhJAHnxitIHqQhHp_5wbiGtZ0q1JC80cHGwd25F0nkrJt0wpF2CTpAhREC2tHnCDw2irbvFlfPLM_CTWKKTwb6TsaUPCRn6QEXkRKSQJSLozmtENsoah0nsbZN7jUYxR4WpOTu2b4Pswm1SY8cdC2TC2KCKLgDWVk7wsf_EQcXgmgrDXKthitNO5M5tldADVH_V6xr70Y3mfPXM-2kDVS5z4ikG_YleRFxjHeRSquooqTRD8SNRur38v-XFa9cbdmbxhfYj8U'
const METAAPI_ACCOUNT_ID = () => process.env.METAAPI_ACCOUNT_ID || 'b668b9b8-594e-4789-a87d-1586040d084d'
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

    // Poll popular symbols for live pricing
    // Using ~60 most popular symbols to balance rate limits vs coverage
    this.liveSymbols = [
      // Forex (15 major pairs)
      'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD.i', 'USDCHF.i', 'EURGBP.i', 'EURJPY.i', 'GBPJPY.i',
      'EURAUD.i', 'EURCAD.i', 'EURCHF.i', 'GBPNZD.i', 'AUDJPY.i',
      // Metals (6)
      'XAUUSD.i', 'XAGUSD.i', 'XPTUSD.i', 'XPDUSD.i', 'XAUAUD.i', 'XAUJPY.i',
      // Crypto (10)
      'BTCUSD.i', 'XRPUSD.i', 'BNBUSD.i', 'SOLUSD.i', 'ADAUSD.i', 'DOTUSD.i', 'UNIUSD.i', 'XLMUSD.i', 'TRXUSD.i', 'ETCUSD.i',
      // Indices (10)
      'US30.i', 'UK100.i', 'GER40.i', 'FRA40.i', 'AUS200.i', 'JPN225.i', 'SPX500.i', 'NAS100.i', 'DJ30ft.i', 'SP500ft.i',
      // Commodities (5)
      'CL-OIL.i', 'NG.i', 'Coffee.i', 'Cocoa.i', 'Wheat.i',
      // Popular Stocks/ETFs (4)
      'EURUSD.i', 'EURUSD', 'GBPUSD.i', 'USDJPY.i'
    ]

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
    return SYMBOL_INFO[symbol] || null
  }

  /**
   * Check if symbol is supported
   */
  isSymbolSupported(symbol) {
    return WORKING_SYMBOLS.includes(symbol)
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
      // Build URL with query params
      // //sanket - Use the specific market data subdomain for historical candles
      let url = `${METAAPI_MARKET_DATA_URL()}/users/current/accounts/${accountId}/historical-market-data/symbols/${symbol}/timeframes/${metaTimeframe}/candles`
      const params = new URLSearchParams()
      if (startTime) params.append('startTime', new Date(startTime * 1000).toISOString())
      if (endTime) params.append('endTime', new Date(endTime * 1000).toISOString())
      if (limit) params.append('limit', Math.min(limit, 1000))

      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, { headers: this.getHeaders() })

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

      return candles
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
