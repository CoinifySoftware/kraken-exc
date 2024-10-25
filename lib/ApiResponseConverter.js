const coinifyCurrency = require('@coinify/currency');
const constants = require('./constants');

module.exports = {
  convertFromKrakenTransaction,
  convertToKrakenCurrencyCode,
  convertFromKrakenCurrencyCode,
  convertFromKrakenTrade
};

/**
 * convertKrakenWithdrawalToTransaction
 *
 * @param {object} transaction Kraken API representation of a transaction (withdrawal / deposit)
 * @returns {object} internal API representation of a transaction as defined in the readme
 */
function convertFromKrakenTransaction(transaction) {
  if (!transaction) {
    return null;
  }

  const currency = convertFromKrakenCurrencyCode(transaction.asset);
  const amount = coinifyCurrency.toSmallestSubunit(transaction.amount, currency);

  return {
    externalId: transaction.refid,
    timestamp: convertKrakenTimestampToISOString(transaction.time),
    state: 'completed',
    amount,
    currency,
    type: transaction.type,
    raw: transaction
  };

}

/**
 * convertKrakenTimestampToISOString
 *
 * @param {float} timestampSeconds number of seconds since 1970-01-01
 * @returns {string} date according to the ISO8601 format. e.g. 2016-09-22T07:50:03.000Z
 */
function convertKrakenTimestampToISOString(timestampSeconds) {
  return new Date(timestampSeconds*1000).toISOString();
}

/**
 * convertFromKrakenCurrencyCode
 *
 * @param {string} krakenCurrencyCode Currency code as represented by Kraken (eg: ZUSD, ZDKK, XXBT, XETH)
 * @returns {string} normalized currency code (eg: USD, DKK, BTC. ETH)
 */
function convertFromKrakenCurrencyCode(krakenCurrencyCode) {
  const currencyCodesMap = {
    KFEE: 'KFEE',
    XETC: 'ETC',
    XETH: 'ETH',
    XLTC: 'LTC',
    XNMC: 'NMC',
    XXBT: 'BTC',
    XBT: 'BTC',
    XXDG: 'DOGE',
    XDG: 'DOGE',
    XXLM: 'XLM',
    XXRP: 'XRP',
    XXVN: 'XVN',
    ZCAD: 'CAD',
    ZEUR: 'EUR',
    ZGBP: 'GBP',
    ZJPY: 'JPY',
    ZKRW: 'KRW',
    ZUSD: 'USD'
  };

  const mapped = currencyCodesMap[krakenCurrencyCode];
  return mapped || krakenCurrencyCode;
}


/**
 * convertToKrakenCurrencyCode
 *
 * @param{string} currencyCode Normalized currency code (eg: USD, DKK, BTC. ETH)
 * @returns {string} currency code as represented by Kraken (eg: ZUSD, ZDKK, XXBT, XETH)
 */
function convertToKrakenCurrencyCode(currencyCode) {
  const currencyCodesMap = {
    KFEE: 'KFEE',
    ETC: 'XETC',
    ETH: 'XETH',
    LTC: 'XLTC',
    NMC: 'XNMC',
    BTC: 'XXBT',
    DOGE: 'XXDG',
    XLM: 'XXLM',
    XRP: 'XXRP',
    XVN: 'XXVN',
    CAD: 'ZCAD',
    EUR: 'ZEUR',
    GBP: 'ZGBP',
    JPY: 'ZJPY',
    KRW: 'ZKRW',
    USD: 'ZUSD'
  };
  const mapped = currencyCodesMap[currencyCode];
  return mapped || currencyCode;
}

function parseCurrencyPair(pair) {
  function getValidCurrency(sliceLength) {
    const baseCurrency = pair.slice(0, sliceLength);
    const convertedBase = convertFromKrakenCurrencyCode(baseCurrency);
    if (constants.PASSTHRU_CURRENCIES.includes(convertedBase) || convertedBase !== baseCurrency) {
      return [ convertedBase, pair.slice(sliceLength) ];
    }
    return null;
  }

  // Try 4-character slice first, then 3-character if 4 is invalid
  const result = getValidCurrency(4) || getValidCurrency(3);

  if (!result) {
    return { error: `Invalid base currency code in pair: ${pair}` };
  }

  // Validate the remaining string (quote currency)
  const [ baseCurrency, remainingPair ] = result;
  const quoteCurrency = convertFromKrakenCurrencyCode(remainingPair);

  if (quoteCurrency === remainingPair && !constants.PASSTHRU_CURRENCIES.includes(quoteCurrency)) {
    return { error: `Invalid quote currency code in pair: ${pair}` };
  }

  return { baseCurrency, quoteCurrency };
}

/**
 * convertKrakenTrade
 * https://docs.kraken.com/api/docs/rest-api/get-trade-history/
 *
 * @param {string} id Kraken Trade ID (is received as the key in object)
 * @param {object} trade Kraken trade object
 * @returns {[null|string, {
 *   externalId: string;
 *   timestamp: string;
 *   state: 'closed' | string;
 *   baseCurrency: string;
 *   baseAmount: number;
 *   feeAmount: number;
 *   quoteCurrency: string;
 *   quoteAmount: number;
 *   type: 'buy' | 'sell';
 *   orderType: string;
 *   raw: any;
 * }|null]} internal API representation of a trade as defined in the readme
 */
function convertFromKrakenTrade(id, trade) {
  if (!id || !trade) {
    return null;
  }

  const { baseCurrency, quoteCurrency, error } = parseCurrencyPair(trade.pair);

  if(error){
    return [ error, null ];
  }

  const baseAmount = coinifyCurrency.toSmallestSubunit(parseFloat(trade.vol), baseCurrency);
  const feeAmount = coinifyCurrency.toSmallestSubunit(parseFloat(trade.fee), baseCurrency);
  const quoteAmount = coinifyCurrency.toSmallestSubunit(parseFloat(trade.cost), quoteCurrency);

  return [ null, {
    externalId: id,
    timestamp: convertKrakenTimestampToISOString(trade.time),
    state: 'closed',
    baseCurrency,
    baseAmount,
    feeAmount,
    quoteCurrency,
    quoteAmount,
    type: trade.type,
    orderType: trade.orderType,
    raw: { id, ...trade }
  } ];
}
