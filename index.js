const _ = require('lodash');
const coinifyCurrency = require('@coinify/currency');
const Error = require('./lib/ErrorHelper');
const Request = require('./lib/RequestHelper');
const {
  convertFromKrakenCurrencyCode,
  convertToKrakenCurrencyCode,
  convertFromKrakenTransaction,
  convertFromKrakenTrade
} = require('./lib/ApiResponseConverter');
const consoleLogLevel = require('console-log-level');
const constants = require('./lib/constants');

const Kraken = function (settings) {
  this.key = settings.key;
  this.secret = settings.secret;
  this.otp = settings.otp;
  this.host = settings.host || constants.HOST;
  this.timeout = settings.timeout || constants.REQUEST_TIMEOUT;
  this.logger = settings.logger || consoleLogLevel({ level: process.env.LOG_LEVEL || 'debug' });

  const normalizedSupportedCurrencies = settings.supportedCurrencies || constants.SUPPORTED_BASE_CURRENCIES;
  this.supportedCurrencies = normalizedSupportedCurrencies.map(convertToKrakenCurrencyCode);
};

/* =================   API endpoints exposed methods   ================= */

function validateCurrenciesConstructPair(baseCurrency, quoteCurrency) {
  if (!baseCurrency || !quoteCurrency) {
    return {
      error: Error.create('Missing base currency or quote currency',
        Error.MODULE_ERROR, null)
    };
  }

  baseCurrency = baseCurrency.toUpperCase();
  quoteCurrency = quoteCurrency.toUpperCase();

  if (!_.includes(constants.SUPPORTED_BASE_CURRENCIES, baseCurrency) || !_.includes(constants.SUPPORTED_QUOTE_CURRENCIES, quoteCurrency)) {
    return {
      error: Error.create(`Kraken only supports ${constants.SUPPORTED_BASE_CURRENCIES.join(', ')} as base and ${constants.SUPPORTED_QUOTE_CURRENCIES.join(', ')} as quote currencies.`,
        Error.MODULE_ERROR, null)
    };
  }

  /* Kraken returns XBT as BTC. It accepts both variations, but returns XBT only. */
  const baseCurrencyKraken = baseCurrency === 'BTC' ? 'XBT' : baseCurrency;

  let pair;
  let inversePair = false;
  const concatPair = `${baseCurrency}${quoteCurrency}`;

  // Map to inconsistent Kraken pairs
  if ([ 'BTC', 'ETH' ].includes(baseCurrency)) {
    pair = `X${baseCurrencyKraken}Z${quoteCurrency}`;
  } else if ([ 'USDT' ].includes(baseCurrency) && [ 'USD' ].includes(quoteCurrency)) {
    pair = `${baseCurrencyKraken}Z${quoteCurrency}`;
  }else if (constants.INVERSE_CURRENCY_PAIRS[concatPair]){
    const inverseBase = constants.INVERSE_CURRENCY_PAIRS[concatPair].slice(0, quoteCurrency.length);
    const inverseQuote = constants.INVERSE_CURRENCY_PAIRS[concatPair].slice(quoteCurrency.length);

    inversePair = true;
    pair = `X${inverseBase}Z${inverseQuote}`;
  } else {
    pair = `${baseCurrencyKraken}${quoteCurrency}`;
  }

  // const inversePair = constants.INVERSE_CURRENCY_PAIRS[`${quoteCurrency}${baseCurrency}`] || false;

  return {
    baseCurrency,
    quoteCurrency,
    baseCurrencyKraken,
    pair,
    inversePair
  };
}

/**
 * Returns the current order book of Kraken in a custom organized look
 *
 * @param {string}      baseCurrency    The currency code (3 chars) of the base currency of the order book
 * @param {string}      quoteCurrency   The currency code (3 chars) of the quote currency of the order book
 * @param {function}    callback        Returns the customized Order Book data object
 *          orderBook:
 *             {
 *              baseCurrency: "BTC", // The currency of baseAmount
 *              quoteCurrency: "USD", // The currency to determine the price <quoteCurrency>/baseCurrency>
 *              asks: [ // List of entries with bitcoins for sale, sorted by lowest price first
 *               {
 *                 price: 450.65,
 *                 baseAmount: 44556677 // 0.44556677 BTC for sale
 *               }
 *               // ... more ask entries
 *             ],
 *             bids: [ // List of entries for buying bitcoins, sorted by most highest price first
 *               {
 *                 price: 450.31,
 *                 baseAmount: 33445566 // Someone wants to buy 0.33445566 BTC
 *               }
 *               // ... more bid entries
 *             ]
 *           }
 */
Kraken.prototype.getOrderBook = function (baseCurrency, quoteCurrency, callback) {
  const currencies = validateCurrenciesConstructPair(baseCurrency, quoteCurrency);
  if (currencies.error) {
    return callback(currencies.error);
  }

  Request.get(this, 'Depth', {
    qs: { pair: currencies.pair }
  }, (err, res) => {
    if (err) {
      return callback(err);
    }

    // This happened, so lets fix it for kraken
    if (res['BTC/USD']) {
      res.XXBTZUSD = res['BTC/USD'];
    }

    if (!res[currencies.pair]) {
      return callback(Error.create(`Currency pair: ${currencies.pair} is not in response`,
        Error.MODULE_ERROR, null));
    }

    /* Declare the orderBook object with the currency pair */
    const orderBook = {
      baseCurrency: currencies.baseCurrency,
      quoteCurrency: currencies.quoteCurrency,
      bids: [],
      asks: []
    };

    /* Organize the Order Book values in a custom way */
    const convertRawEntry = function convertRawEntry(entry) {
      const price = parseFloat(entry[0]);
      const baseAmount = coinifyCurrency.toSmallestSubunit(parseFloat(entry[1]), currencies.baseCurrency);

      if (currencies.inversePair) {
        return {
          price: 1 / price,
          baseAmount: coinifyCurrency.toSmallestSubunit(baseAmount * price, currencies.quoteCurrency)
        };
      }

      return { price, baseAmount };
    };

    const rawBids = res[currencies.pair].bids || [];
    const rawAsks = res[currencies.pair].asks || [];

    /* Declare and assign the organized bids and asks to the orderBook object */
    orderBook.bids = rawBids.map(convertRawEntry);
    orderBook.asks = rawAsks.map(convertRawEntry);

    return callback(null, orderBook);
  });
};



/**
 * Returns ticker information for a given currency pair.
 *
 * @param {string}      baseCurrency    The currency code (3 chars) of the base currency of the ticker
 * @param {string}      quoteCurrency   The currency code (3 chars) of the quote currency of the ticker
 * @param {function}    callback        Returns the customized Order Book data object
 *             {
 *              baseCurrency: 'BTC',
 *              quoteCurrency: 'USD',
 *              bid: 649.89,
 *              ask: 650.12,
 *              lastPrice: 649.97,
 *              high24Hours: 652.55,
 *              low24Hours: 634.98,
 *              vwap24Hours: 647.37,
 *              volume24Hours: 1234567890 // 12.3456789 BTC
 *             }
 */
Kraken.prototype.getTicker = function (baseCurrency, quoteCurrency, callback) {
  const currencies = validateCurrenciesConstructPair(baseCurrency, quoteCurrency);
  if (currencies.error) {
    return callback(currencies.error);
  }

  Request.get(this, 'Ticker', {
    qs: { pair: currencies.pair }
  }, (err, res) => {
    if (err) {
      return callback(err);
    }

    /*
     * Kraken returns a response with the following format:
     * {
     *    <pair_name>: {
     *        a: [<price>, <whole lot volume>, <lot volume>], // ask
     *        b: [<price>, <whole lot volume>, <lot volume>], // bid
     *        c: [<price>, <lot volume>],                     // last trade closed
     *        v: [<today>, <last 24 hours>],                  // volume
     *        p: [<today>, <last 24 hours>],                  // volume weighted average price
     *        t: [<today>, <last 24 hours>],                  // number of trades
     *        l: [<today>, <last 24 hours>],                  // low
     *        h: [<today>, <last 24 hours>],                  // high
     *        o: <price>                                      // today's opening price
     *    }
     * }
     */
    const result = res[currencies.pair];

    if(currencies.inversePair){
      return callback(null, {
        baseCurrency: currencies.baseCurrency, // We do not flip the input pair as it is the correct direction
        quoteCurrency: currencies.quoteCurrency,
        bid: 1 / parseFloat(result.a[0]), // flip bid to ask
        ask: 1 / parseFloat(result.b[0]), // flip ask to bid
        lastPrice: 1 / parseFloat(result.c[0]),
        high24Hours: 1 / parseFloat(result.l[1]), // flip low to high
        low24Hours: 1 / parseFloat(result.h[1]), // flip high to low
        vwap24Hours: 1 / parseFloat(result.p[1]),
        volume24Hours: coinifyCurrency.toSmallestSubunit(result.v[1], currencies.quoteCurrency)
      });
    }

    return callback(null, {
      baseCurrency: currencies.baseCurrency,
      quoteCurrency: currencies.quoteCurrency,
      bid: parseFloat(result.b[0]),
      ask: parseFloat(result.a[0]),
      lastPrice: parseFloat(result.c[0]),
      high24Hours: parseFloat(result.h[1]),
      low24Hours: parseFloat(result.l[1]),
      vwap24Hours: parseFloat(result.p[1]),
      volume24Hours: coinifyCurrency.toSmallestSubunit(result.v[1], currencies.baseCurrency)
    });
  });
};

/**
 * Returns the available and total balance amounts of the account.
 *
 * @param {function}    callback Returns the customized balance object
 *                      balance: {
 *                          available: {
 *                                  USD: <int subunit amount>,
 *                                  EUR: <int subunit amount>,
 *                                  BTC: <int subunit amount>
 *                              }
 *                          total: {
 *                                  USD: <int subunit amount>,
 *                                  EUR: <int subunit amount>,
 *                                  BTC: <int subunit amount>
 *                              }
 *                      }
 */
Kraken.prototype.getBalance = function (callback) {
  /* Firstly, get the total balance values */
  Request.post(this, 'Balance', null, (err, resBalance) => {
    if (err) {
      return callback(err);
    }

    /* Secondly, get the open orders */
    Request.post(this, 'OpenOrders', {}, (err, resOrders) => {
      if (err) {
        return callback(err);
      }

      try {
        // Get currencies we want to store balance for and convert to subunits
        const total = _(resBalance)
          .mapKeys((amount, currency) => convertFromKrakenCurrencyCode(currency))
          .pickBy((amount, currency) => coinifyCurrency.isValidCurrency(currency))
          .mapValues((amount, currency) => coinifyCurrency.toSmallestSubunit(amount, currency))
          .value();

        const toSubtractFromTotal = _(_.cloneDeep(total)).mapValues(() => 0).value();
        /*
        * Loop through the open orders (reserved) and accumulate amounts to be subtracted from the total balance, so
        * that we calculate how much is the available balance
        */
        _.forEach(resOrders.open, (order) => {
          const baseCurrency = convertFromKrakenCurrencyCode(order.descr.pair.slice(0, 3));
          const quoteCurrency = order.descr.pair.slice(3);

          /*
          * The crypto currency is always the base and fiat is the quote in the orders. Therefore, for SELL orders we
          * want to see the volume we are selling (the `vol` property) and reserve it. And for BUY orders we want to see
          * how much we are buying for (the `descr.price` property) and reserve it.
          */
          switch (order.descr.type) {
            case 'sell':
              toSubtractFromTotal[baseCurrency] += coinifyCurrency.toSmallestSubunit(order.vol, baseCurrency);
              break;
            case 'buy':
              toSubtractFromTotal[quoteCurrency] += coinifyCurrency.toSmallestSubunit(order.descr.price, quoteCurrency);
              break;
          }
        });

        const available = _(_.cloneDeep(total)).mapValues((amount, currency) => amount - toSubtractFromTotal[currency]).value();

        return callback(null, {
          available,
          total
        });
      } catch (err) {
        return callback(err);
      }
    });
  });
};

/**
 * Fetches a trade object which contains the status and an array of the transactions to that trade.
 * Constructs and returns an object with trade currency pair and accummulated amounts from all transactions
 * of the trade.
 *
 * @param {object}  tradeToQuery  An object that contains data about the trade to be fetched. Must have at least the
 *                                following structure:
 * trade:
 * {
 *    raw: {
 *        txid: <string> the_trade_id,
 *        <string> order_type
 *    }
 * }
 * @param {function}    callback    Returns the found and customized trade object:
 *  {
 *    type: 'limit',
 *    state: 'closed',
 *    baseAmount: -200000000, // Sold 2.00000000 BTC...
 *    quoteAmount: 74526,     // ... for 745.26 USD
 *    baseCurrency: 'BTC'     // coinifyCurrency of the baseAmount
 *    quoteCurrency: 'USD'    // coinifyCurrency of the quoteAmount
 *    feeAmount: 11,          // We paid 0.11 USD to the exchange as commission for the order
 *    feeCurrency: 'USD',     // coinifyCurrency of the feeAmount
 *    raw: {...},             // Exchange-specific object
 *  }
 */
Kraken.prototype.getTrade = function (tradeToQuery, callback) {
  if (!tradeToQuery || !callback) {
    return callback(Error.create('Trade object is a required parameter.', Error.MODULE_ERROR, null));
  }
  if (!tradeToQuery.raw) {
    return callback(Error.create('\'trade.raw\' is a required property.', Error.MODULE_ERROR, null));
  }

  const txid = getTransactionIdFromTrade(tradeToQuery);

  Request.post(this, 'QueryTrades', {
    txid
  }, (err, resTrade) => {
    /*
     * 'QueryTrades' returns only the 'closed' Trades, whereas we want to check for trades in both 'closed' and 'open'
     * "Invalid order" error means tha provided 'txid' is of non-existent Trade - therefore check if it's still an
     * 'open' order.
     */
    if (err && err.errorMessages && _.find(err.errorMessages, msg => msg === 'EOrder:Invalid order')) {
      Request.post(this, 'QueryOrders', {
        txid
      }, (err, resOrder) => {
        if (err) {
          return callback(err);
        }
        /*
         * Kraken returns a response, from QueryTrades endpoint, with the following format (listing only properties
         * that we actually use):
         *
         * { 'OEX7R7-ID6ZP-KATRCD':
         *    {
         *      status: 'open',
         *      descr:
         *      { pair: 'XBTEUR',
         *        type: 'buy',
         *        ordertype: 'limit',
         *        price: '1.000',
         *        order: 'buy 4.00000000 XBTEUR @ limit 1.000'
         *      },
         *      vol: '4.00000000',
         *      fee: '0.00000'
         *  }
         */
        return callback(null, constructTradeObject(resOrder, 'order', txid));
      });
    } else {
      if (err) {
        return callback(err);
      }
      /*
       * Kraken returns a response, from QueryTrades endpoint, with the following format (listing only properties
       * that we actually use):
       *
       * { 'TEBCPN-YCQ7U-PQSUJF':               // ID of the Trade that we are querying
       *    {
       *      pair: 'XXBTZEUR',                 // coinifyCurrency pair of the Trade: 'X<baseCurrency>Z<quoteCurrency>'
       *      type: 'sell',                     // type of the trade (sell/buy)
       *      ordertype: 'market',              // type of the order (market/limit)
       *      price: '507.00000',               // the price it's been sold/bought for, denominated in quoteCurrency
       *      fee: '0.01318',                   // commission fee paid for the order execution, denominated in quoteCurrency
       *      vol: '0.01000000'                 // the volume that has been bough/sold, denominated in baseCurrency
       *    }
       * }
       */
      return callback(null, constructTradeObject(resTrade, 'trade', txid));
    }
  });
};

/* Extracts the transaction id from the trade object
 *
 * @param {object} trade object returned by placeTrade or getTrade method.
 * @returns {string} transactionId
 */
function getTransactionIdFromTrade(trade) {
  const raw = trade.raw;
  if (raw.hasOwnProperty('txid')) {
    return raw.txid[0];
  }
  return Object.getOwnPropertyNames(raw)[0];
}

/**
 * Constructs and returns the desired custom formatted object.
 *
 * When a trade - all data needed is contained withing the main sub-object of the response: `res[txid]`.
 * When an open order - some of the values are withing the main sub-object, and others are withing a sub-sub-object:
 * `res[txid].descr`
 * That is why an `entityType` is passed as an argument and throughout the function body, different values are picked
 * from different sub-objects, for `!isTrade` (non-trade) response data.
 *
 * @param {object}  responseData  The response object itthis
 * @param {string}  entityType    The type: 'trade' or 'order'
 * @param {string}  tradeId       The trade ID
 * @returns See return result of getTrade() endpoint
 */
function constructTradeObject(responseData, entityType, tradeId) {
  const isTrade = entityType === 'trade', // TRUE if it's a Trade, FALSE if it's an Open Order
    tradeValues = entityType === 'trade' ? responseData[tradeId] : responseData[tradeId].descr;

  let baseCurrency = isTrade ? tradeValues.pair.slice(1, 4) : tradeValues.pair.slice(0, 3);
  const quoteCurrency = isTrade ? tradeValues.pair.slice(5) : tradeValues.pair.slice(3);
  baseCurrency = baseCurrency === 'XBT' ? 'BTC' : baseCurrency;

  const baseAmount = coinifyCurrency.toSmallestSubunit(parseFloat(responseData[tradeId].vol), baseCurrency);

  let state = isTrade ? 'closed' : responseData[tradeId].status;

  // Rename canceled to cancelled
  if (state === 'canceled') {
    state = 'cancelled';
  }

  //Kraken returns quote amount and fee amount as 0 for open orders, we would like it to be null
  let quoteAmount = null;
  let feeAmount = null;
  if (state !== 'open') {
    quoteAmount = coinifyCurrency.toSmallestSubunit(parseFloat(responseData[tradeId].cost), quoteCurrency);
    quoteAmount = tradeValues.type === constants.TYPE_BUY_ORDER ? -quoteAmount : quoteAmount;
    feeAmount = coinifyCurrency.toSmallestSubunit(parseFloat(responseData[tradeId].fee), quoteCurrency);
  }

  return {
    externalId: tradeId,
    type: tradeValues.ordertype,
    state,
    baseAmount: tradeValues.type === constants.TYPE_SELL_ORDER ? -baseAmount : baseAmount,
    quoteAmount,
    baseCurrency,
    quoteCurrency,
    feeAmount,
    feeCurrency: quoteCurrency,
    raw: responseData
  };
}

/**
 * Returns a list of transactions objects, starting from the latest one, descending, fetched from your Kraken
 * account.
 * If the `latestTransaction` is provided, then fetch the transactions from the provided one, onwards.
 * Otherwise, return ALL transactions.
 *
 * @param {object}      latestTransaction   The transaction object, onwards from which to start fetching deposits. Must have
 *                                          a raw.time attribute which represents a unix timestamp in seconds
 * @param {function}    callback            Returns the found transactions, sorted by earliest first
 */
Kraken.prototype.listTransactions = function (latestTransaction, callback) {
  // Allow for listTransactions(callback) shorthand
  if (typeof latestTransaction === 'function') {
    callback = latestTransaction;
    latestTransaction = undefined;
  }

  // If a latestTransaction is given, use that to not get transactions earlier than that one.
  // We have to truncate the unix timestamp in order to be sure that latestTransaction is included in the response
  const start = latestTransaction ? Math.trunc(latestTransaction.raw.time) : null;

  // Get withdrawals
  return this._listTransactionsRecursive('withdrawal', start, [], (err, withdrawals) => {
    if (err) {
      return callback(err);
    }

    // Get deposits
    return this._listTransactionsRecursive('deposit', start, [], (err, deposits) => {
      if (err) {
        return callback(err);
      }

      // Join deposits and withdrawals into a single array
      const transactions = withdrawals.concat(deposits);

      // Sort transactions by earliest first
      const transactionsSorted = _.sortBy(transactions, [ 'raw.time' ]);

      // Return sorted transactions to caller
      return callback(null, transactionsSorted);
    });
  });
};


/**
 * Recursively calls the Ledgers endpoint until all ledger entries have been fetched
 *
 * @param {string} type Type of ledger entry to query for. 'withdrawal' or 'deposit'
 * @param {float|null} start Unix timestamp of earliest entry to query for
 * @param {array} knownTransactions Transactions already received from previous calls
 * @param {function} callback Yields a list of transactions, sorting is undefined
 * @private
 */
Kraken.prototype._listTransactionsRecursive = function (type, start, knownTransactions, callback) {
  // Perform POST request to Ledgers endpoint
  const postData = {
    type: type,
    ofs: knownTransactions.length
  };
  if (start) {
    postData.start = start;
  }
  return Request.post(this, 'Ledgers', postData, (err, response) => {
    // Relay error, if any
    if (err) {
      return callback(err);
    }

    // Check that the response contains ledger
    if (!_.isObject(response.ledger)) {
      const error = Error.create('Unexpected response from Ledgers endpoint', Error.EXCHANGE_SERVER_ERROR);
      error.responseBody = JSON.stringify(response);
      return callback(error);
    }

    try {
      // Construct transaction objects for each ledger entry
      const transactions = _.values(response.ledger)
        .map(transaction => {
          const symbol = convertFromKrakenCurrencyCode(transaction.asset);
          if(!coinifyCurrency.isValidCurrency(symbol)) {
            this.logger.info(transaction, `Invalid currency '${symbol}'`);
            return null;
          }

          return convertFromKrakenTransaction(transaction);
        })
        .filter(item => item !== null);

      // Merge our newly converted transactions with the ones from previous calls
      const allTransactions = transactions.concat(knownTransactions);

      // Decide how to progress: Continue if there are more ledger entries, otherwise just stop now.
      if (_.isEmpty(response.ledger)) {
        // No more ledger entries to be found. Let's just return them now!
        return callback(null, allTransactions);
      }

      // There are more entries to be found, let's call this function recursively and add the results to our list
      return this._listTransactionsRecursive(type, start, allTransactions, callback);
    } catch (err) {
      return callback(err);
    }
  });
};

/**
 * Place a limit BUY or SELL trade (order), depending on the sign of the baseAmount provided.
 * SELL if amount is negative
 * BUY if amount is positive
 *
 * @param {int}         baseAmount      The amount in base currency to buy or sell on the exchange; If negative amount,
 *                                      place sell limit order. If positive amount, place buy limit order. Denominated in
 *                                      smallest sub-unit of the base currency
 * @param {number}      limitPrice      The minimum/maximum rate that you want to sell/buy for. If baseAmount is negative, this
 *                                      is the minimum rate to sell for. If baseAmount is positive, this is the maximum rate to
 *                                      buy for. limitPrice must always strictly positive
 * @param {string}      baseCurrency    The exchange's base currency. For Kraken it is always BTC or BSV
 * @param {string}      quoteCurrency   The exchange's quote currency. For Kraken it is always USD
 * @param {function}    callback        Returns the customized data object of the placed trade object data
 */
Kraken.prototype.placeTrade = function (baseAmount, limitPrice, baseCurrency, quoteCurrency, callback) {
  const currencies = validateCurrenciesConstructPair(baseCurrency, quoteCurrency);
  if (currencies.error) {
    return callback(currencies.error);
  }
  if (!baseAmount || isNaN(baseAmount) || baseAmount === 0) {
    return callback(Error.create('The base amount must be a number and larger or smaller than 0.', Error.MODULE_ERROR, null));
  }
  if (!limitPrice || isNaN(limitPrice) || limitPrice < 0) {
    return callback(Error.create('The limit price must be a positive number.', Error.MODULE_ERROR, null));
  }

  /*
   * API call fails if there is more than 1 decimails of precision
   * So we round to nearest decimal
   */
  limitPrice = Math.round(10 * limitPrice) / 10;

  /* Decide whether to place a BUY or a SELL trade */
  const orderType = baseAmount < 0 ? constants.TYPE_SELL_ORDER : constants.TYPE_BUY_ORDER,
    amountSubUnit = Math.abs(baseAmount);

  /*
   * The amount passed to the method is denominated in smallest sub-unit, but Kraken API requires
   * the amount to be in main unit, so we convert it.
   */
  const amountMainUnit = coinifyCurrency.fromSmallestSubunit(amountSubUnit, currencies.baseCurrency);

  const params = {
    pair: currencies.pair,
    type: orderType,
    ordertype: 'limit',
    price: limitPrice,
    volume: amountMainUnit
  };

  Request.post(this, 'AddOrder', params, (err, res) => {
    if (err) {
      return callback(err);
    }

    /* Construct the custom trade response object */
    const trade = {
      externalId: res.txid[0],
      type: 'limit',
      state: 'open',
      baseAmount: baseAmount,
      baseCurrency: currencies.baseCurrency,
      quoteCurrency: currencies.quoteCurrency,
      limitPrice: limitPrice,
      raw: res
    };

    return callback(null, trade);
  });
};

/**
 * Lists Trade History for a given period.
 *
 * @typedef {Function} CallbackFn
 *
 * @param {Error|null} error
 * @param {{
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
 * }[]} trade - An array of trade details.
 *
 * @returns {void}
 */
/**
 * @param {Date}   fromDateTime The start DateTime
 * @param {Date}   toDateTime The end DateTime
 * @param {CallbackFn}  callback Returns the customized data object of the trades in the given period
 */
Kraken.prototype.listTradeHistoryForPeriod = function (fromDateTime, toDateTime, callback) {
  if (Object.prototype.toString.call(fromDateTime) !== '[object Date]' || Object.prototype.toString.call(toDateTime) !== '[object Date]') {
    return callback(Error.create('fromDateTime and toDateTime must be an instance of Date.', Error.MODULE_ERROR, null), null);
  }

  Request.post(this, 'TradesHistory', {
    type: 'all',
    trades: false,
    start: fromDateTime.getTime() / 1000,
    end: toDateTime.getTime() / 1000
  }, (err, res) => {
    if (err) {
      return callback(err, null);
    }

    const { trades } = res;

    if (!trades || typeof trades !== 'object') {
      return callback(Error.create('Invalid response from kraken trades endpoint.', Error.MODULE_ERROR, res), null);
    }

    if (Object.keys(trades).length === 0) {
      return callback(null, []);
    }

    const validTrades = [];
    for (const [ tradeId, trade ] of Object.entries(trades)) {
      if (trade.time < fromDateTime.getTime() / 1000 || trade.time > toDateTime.getTime() / 1000) {
        continue;
      }

      const [ err, converted ] = convertFromKrakenTrade(tradeId, trade);

      if (err && !converted) {
        this.logger.info('Cannot convert kraken trade to internal trade', { tradeId, trade });
        continue;
      }

      validTrades.push(converted);
    }

    callback(null, validTrades);
  });
};

Kraken.prototype.listTrades = async function (latestTrade = null) {
  return new Promise((resolve, reject) => {
    const latestTxDate = latestTrade && latestTrade.createTime
      ? latestTrade.createTime
      : new Date(0);

    this.listTradeHistoryForPeriod(latestTxDate, new Date(), (error, trades) => {
      if (error) {
        return reject(error);
      }

      resolve(trades || []);
    });
  });
};


module.exports = Kraken;
