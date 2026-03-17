/**
 * Script to list all available symbols on your MetaAPI account
 * Run: node get-metaapi-symbols.js
 */

import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const METAAPI_TOKEN = process.env.METAAPI_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiXSwicmVzb3VyY2VzIjpbImFjY291bnQ6JFVTRVJfSUQkOmI2NjhiOWI4LTU5NGUtNDc4OS1hODdkLTE1ODYwNDBkMDg0ZCJdfSx7ImlkIjoibWV0YWFwaS1yZXN0LWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19LHsiaWQiOiJtZXRhYXBpLXJwYy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFzdGF0cy1hcGkiLCJtZXRob2RzIjpbIm1ldGFzdGF0cy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImlhdCI6MTc3MDYzNTE4OX0.OtP0Fw4z0HzLKRqfasbRM3XvdquMBROjRD75QNqVfhMby1610fAlb95yG7H8WX_EhxFUXFVTEXOOCPumDCeCpFI0NAL-eGOiA6CgbXAPB5RjB95qCPamzub6MaK8c-ZWlkntrRekQgVu-vtYUsaTvC-1ZKY9Qcv4X4o7kesbiF373EXGdDyHD59i3p3FVkaVBT424jN8tA-qbBq7DPO6I_78P3U-Xg5tEQasam6LKG9UkJtMwi8CZMhL8Xtx63gb1phc0egXUhZQtfwyg7hQvdwFfV2fU8-vnVjZ_oq2kV8vg5Jk1mtyslfUmdHWeUJTFQ5QNWA5w1NDqwECsofPvGPqRMQmUOw6FQEpc9NpsRazOQ9Y_1c2FPGanrA-AbLopd8DpOCuok6LCFCWAtytkIyset9QTH6qMQyhJAHnxitIHqQhHp_5wbiGtZ0q1JC80cHGwd25F0nkrJt0wpF2CTpAhREC2tHnCDw2irbvFlfPLM_CTWKKTwb6TsaUPCRn6QEXkRKSQJSLozmtENsoah0nsbZN7jUYxR4WpOTu2b4Pswm1SY8cdC2TC2KCKLgDWVk7wsf_EQcXgmgrDXKthitNO5M5tldADVH_V6xr70Y3mfPXM-2kDVS5z4ikG_YleRFxjHeRSquooqTRD8SNRur38v-XFa9cbdmbxhfYj8U';
const METAAPI_ACCOUNT_ID = process.env.METAAPI_ACCOUNT_ID || 'b668b9b8-594e-4789-a87d-1586040d084d';
const METAAPI_REGION = process.env.METAAPI_REGION || 'london';
const METAAPI_BASE_URL = `https://mt-client-api-v1.${METAAPI_REGION}.agiliumtrade.ai`;

const headers = {
  'auth-token': METAAPI_TOKEN,
  'Content-Type': 'application/json'
};

async function getAvailableSymbols() {
  try {
    console.log('[MetaAPI] Fetching available symbols for account:', METAAPI_ACCOUNT_ID);
    console.log('[MetaAPI] Region:', METAAPI_REGION);
    console.log('');

    // Get account details with symbols
    const url = `${METAAPI_BASE_URL}/users/current/accounts/${METAAPI_ACCOUNT_ID}/symbols`;

    console.log('[MetaAPI] Requesting:', url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`[MetaAPI] Error: HTTP ${response.status}`);
      const error = await response.text();
      console.error('[MetaAPI] Response:', error);
      return;
    }

    const symbols = await response.json();
    
    console.log(`[MetaAPI] ✅ Found ${symbols.length} symbols available:\n`);
    
    // Group symbols by type
    const grouped = {
      forex: [],
      metals: [],
      crypto: [],
      indices: [],
      commodities: [],
      other: []
    };

    symbols.forEach(sym => {
      const name = sym.symbol || sym;
      if (name.includes('XAU') || name.includes('XAG') || name.includes('XPT') || name.includes('XPD')) {
        grouped.metals.push(name);
      } else if (name.includes('BTC') || name.includes('ETH') || name.includes('XRP') || name.includes('BNB') || name.includes('SOL') || name.includes('ADA') || name.includes('DOGE') || name.includes('DOT') || name.includes('MATIC') || name.includes('AVAX') || name.includes('LINK') || name.includes('UNI') || name.includes('ATOM') || name.includes('XLM') || name.includes('TRX') || name.includes('ETC') || name.includes('NEAR') || name.includes('ALGO') || name.includes('LTC')) {
        grouped.crypto.push(name);
      } else if (name.includes('US30') || name.includes('US500') || name.includes('US100') || name.includes('UK100') || name.includes('GER40') || name.includes('FRA40') || name.includes('JP225') || name.includes('HK50') || name.includes('AUS200')) {
        grouped.indices.push(name);
      } else if (name.includes('OIL') || name.includes('GAS') || name.includes('COPPER') || name.includes('NGAS')) {
        grouped.commodities.push(name);
      } else if (name.length <= 7 && !name.includes('.')) {
        // Likely forex (EURUSD, GBPUSD, etc.)
        grouped.forex.push(name);
      } else {
        grouped.other.push(name);
      }
    });

    if (grouped.forex.length > 0) {
      console.log('💱 FOREX (' + grouped.forex.length + '):');
      console.log('  ' + grouped.forex.join(', '));
      console.log('');
    }

    if (grouped.metals.length > 0) {
      console.log('🥇 METALS (' + grouped.metals.length + '):');
      console.log('  ' + grouped.metals.join(', '));
      console.log('');
    }

    if (grouped.crypto.length > 0) {
      console.log('₿ CRYPTO (' + grouped.crypto.length + '):');
      console.log('  ' + grouped.crypto.join(', '));
      console.log('');
    }

    if (grouped.indices.length > 0) {
      console.log('📊 INDICES (' + grouped.indices.length + '):');
      console.log('  ' + grouped.indices.join(', '));
      console.log('');
    }

    if (grouped.commodities.length > 0) {
      console.log('⚙️  COMMODITIES (' + grouped.commodities.length + '):');
      console.log('  ' + grouped.commodities.join(', '));
      console.log('');
    }

    if (grouped.other.length > 0) {
      console.log('📌 OTHER (' + grouped.other.length + '):');
      console.log('  ' + grouped.other.join(', '));
      console.log('');
    }

    // Create a copy-paste ready array for code
    console.log('\n✅ Use this in metaApiService.js WORKING_SYMBOLS array:\n');
    console.log('const WORKING_SYMBOLS = [');
    symbols.forEach((sym, i) => {
      const comma = i < symbols.length - 1 ? ',' : '';
      console.log(`  '${sym}'${comma}`);
    });
    console.log(']');

  } catch (error) {
    console.error('[MetaAPI] Error:', error.message);
  }
}

getAvailableSymbols();
