import axios from 'axios';

export interface ExchangeBalance {
  total: number;
  available: number;
}

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  exchange: string;
}

const EXCHANGE_ENDPOINTS = {
  huobi: {
    base: 'https://api.huobi.pro',
    balance: '/v1/account/accounts/{account-id}/balance',
    accounts: '/v1/account/accounts',
  },
};

export const SUPPORTED_EXCHANGES = [
  { id: 'huobi', name: 'Huobi' },
];

// Cache exchange balances
const balanceCache = new Map<string, { balance: ExchangeBalance; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds

async function createHuobiSignature(
  method: string,
  host: string,
  path: string,
  params: Record<string, string>,
  secretKey: string
): Promise<string> {
  const timestamp = new Date().toISOString().split('.')[0];

  const sortedParams = new URLSearchParams({
    ...params,
    AccessKeyId: params.apiKey,
    SignatureMethod: 'HmacSHA256',
    SignatureVersion: '2',
    Timestamp: timestamp,
  });

  const payload = [
    method.toUpperCase(),
    host,
    path,
    sortedParams.toString(),
  ].join('\n');

  // Use Web Crypto API instead of Node's crypto
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function getHuobiAccounts(credentials: ExchangeCredentials): Promise<string> {
  const { apiKey, apiSecret } = credentials;
  const host = 'api.huobi.pro';
  const path = '/v1/account/accounts';

  const signature = await createHuobiSignature('GET', host, path, { apiKey }, apiSecret);

  const response = await axios.get(`${EXCHANGE_ENDPOINTS.huobi.base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Trading-Bot/1.0',
      'AccessKeyId': apiKey,
      'SignatureMethod': 'HmacSHA256',
      'SignatureVersion': '2',
      'Timestamp': new Date().toISOString().split('.')[0],
      'Signature': signature,
    },
  });

  if (!response.data?.data?.[0]?.id) {
    throw new Error('No trading account found');
  }

  return response.data.data[0].id;
}

async function getHuobiBalance(credentials: ExchangeCredentials): Promise<ExchangeBalance> {
  const cacheKey = `huobi:${credentials.apiKey}`;
  const cached = balanceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.balance;
  }

  try {
    const accountId = await getHuobiAccounts(credentials);
    const path = `/v1/account/accounts/${accountId}/balance`;
    const host = 'api.huobi.pro';

    const signature = await createHuobiSignature(
      'GET',
      host,
      path,
      { apiKey: credentials.apiKey },
      credentials.apiSecret
    );

    const response = await axios.get(`${EXCHANGE_ENDPOINTS.huobi.base}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Trading-Bot/1.0',
        'AccessKeyId': credentials.apiKey,
        'SignatureMethod': 'HmacSHA256',
        'SignatureVersion': '2',
        'Timestamp': new Date().toISOString().split('.')[0],
        'Signature': signature,
      },
    });

    if (!response.data?.data?.list) {
      throw new Error('Invalid balance response');
    }

    const usdtBalance = response.data.data.list
      .filter((item: any) => item.currency === 'usdt')
      .reduce(
        (acc: ExchangeBalance, item: any) => {
          if (item.type === 'trade') {
            acc.available = parseFloat(item.balance);
          }
          acc.total += parseFloat(item.balance);
          return acc;
        },
        { total: 0, available: 0 }
      );

    balanceCache.set(cacheKey, {
      balance: usdtBalance,
      timestamp: Date.now(),
    });

    return usdtBalance;
  } catch (error) {
    console.error('Error fetching Huobi balance:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('Invalid API credentials');
    }
    throw new Error('Failed to fetch balance');
  }
}

export async function validateExchangeAPI(credentials: ExchangeCredentials): Promise<boolean> {
  try {
    const balance = await getExchangeBalance(credentials);
    return balance.total >= 0;
  } catch (error) {
    console.error(`Error validating ${credentials.exchange} API:`, error);
    return false;
  }
}

export async function getExchangeBalance(credentials: ExchangeCredentials): Promise<ExchangeBalance> {
  try {
    switch (credentials.exchange) {
      case 'huobi':
        return await getHuobiBalance(credentials);
      default:
        throw new Error(`Exchange ${credentials.exchange} is not supported yet`);
    }
  } catch (error) {
    console.error(`Error fetching ${credentials.exchange} balance:`, error);
    throw error;
  }
}