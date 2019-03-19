const HOST = 'https://api.kraken.com'
  , API_VERSION = 0
  , REQUEST_TIMEOUT = 120000 // 2 min
  , TYPE_SELL_ORDER = 'sell'
  , TYPE_BUY_ORDER = 'buy'
  , DEFAULT_SUPPORTED_CURRENCIES = ['ETH', 'BTC', 'BSV', 'EUR', 'USD'];
/*
 * These are all endpoints opened by Kraken. Some of them are public, others are private, which makes a difference
 * in the sense whether to use GET or POST request. That's why, here are 2 static lists, to help that decision.
 */
const METHODS = {
  public: ['Time', 'Assets', 'AssetPairs', 'Ticker', 'Depth', 'Trades', 'Spread', 'OHLC'],
  private: ['Balance', 'TradeBalance', 'OpenOrders', 'ClosedOrders', 'QueryOrders', 'TradesHistory', 'QueryTrades', 'OpenPositions', 'Ledgers', 'QueryLedgers', 'TradeVolume', 'AddOrder', 'CancelOrder', 'DepositMethods', 'DepositAddresses', 'DepositStatus', 'WithdrawInfo', 'Withdraw', 'WithdrawStatus', 'WithdrawCancel']
};

module.exports = {
  HOST: HOST,
  API_VERSION: API_VERSION,
  REQUEST_TIMEOUT: REQUEST_TIMEOUT,
  TYPE_SELL_ORDER: TYPE_SELL_ORDER,
  TYPE_BUY_ORDER: TYPE_BUY_ORDER,
  DEFAULT_SUPPORTED_CURRENCIES: DEFAULT_SUPPORTED_CURRENCIES,

  METHODS: METHODS
};
