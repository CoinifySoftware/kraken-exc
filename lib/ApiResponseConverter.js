const coinifyCurrency = require('@coinify/currency');

module.exports = {
  convertFromKrakenTransaction,
  convertToKrakenCurrencyCode,
  convertFromKrakenCurrencyCode
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
