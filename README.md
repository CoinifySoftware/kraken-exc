Kraken exchange API module
===============

### Install

`npm install kraken-exc`

### About
This module utilizes the Kraken Exchange API. It only covers the main API endpoints (for now).
This document will guide you through a list of the endpoints that this module utilizes, along with explanation of initialization, input parameters, success and error responses, and examples.

### Initialization

```js
var Kraken = require('kraken-exc');

var kraken = new Kraken({
    key: 'your_api_key',
    secret: 'your_api_secret',
    otp: 'your_otp_password'
  }
);
```

The constructor initializes 3 more parameters: `host`, `timeout` and `supportedCurrencies` . If not provided at model declaration, these parameters will be set to `https://api.kraken.com`, `5000` and `['ETH', 'BTC', 'EUR', 'USD']` respectively.

The `supportedCurrencies` property should be an array of strings where each string is a currency code such as `BTC` or `USD`. 

*Note*: All data and errors are returned as objects, not as stringified JSON.

*Note*: All amounts, except the fee and order book price for exchange, are denominated in sub-units. This means 0.01 USD will be returned as 100, and 1.0 BTC will be returned as 100000000.

### Errors format
We use the Node's native `Error` class to generate an error, to which we attach two custom properties: `code` and `cause`.

 * `code` represents the machine readable code for the certain error. Eg. `exchange_server_error` (for a list of all error codes used in the exchange OSS modules, see bellow)

 * `cause` contains the raw error object, returned from the system, be it the Node environment, the exchange server or something else
We use the Error class because later, upon the error object, we can call the `.stack` property (or any other native property), that is auto-generated with the object. This way there is no need to assign it explicitly, when returning the error.

###### Example of an error message
```js
{
  [Error: Kraken only supports BTC as base and USD, EUR as quote currencies, respectively.],
   code: 'internal_module_error',
   cause: 'some cause or an error stack'
}
```

Then, at the receiver side, you can easily call `error.message` to get the custom, human-readable error message, or `error.code` for the machine-readable one, and so on (provided that you call your received object `error`).
##### List of error codes

 * `exchange_server_error`: Indicates that the error has happened in and was received from the remote exchange server itself (Kraken).
 * `internal_module_error`: Indicates that the error has happened internally in the module. This means that a logical failure, a data manipulation failure has occurred or wrong input parameters have been passed to the exposed endpoint.
 * `insufficient_funds`: Indicates that placing a trade failed due to insufficient funds

### Exposed endpoints

#### Ticker
Returns ticker information for a given currency pair

##### Input parameters
`baseCurrency`: The base currency of the currency pair

`quoteCurrency`: The quote currency of the currency pair

##### Example call
```js
kraken.getTicker('BTC', 'USD', function(err, ticker) {
  if (err) {
    console.log(err);
  } else {
    console.log(ticker);
  }
});
```

##### Response on success
```js
{
  baseCurrency: 'BTC',
  quoteCurrency: 'USD',
  bid: 649.89,
  ask: 650.12,
  lastPrice: 649.97,
  high24Hours: 652.55,
  low24Hours: 634.98,
  vwap24Hours: 647.37,
  volume24Hours: 1234567890 // 12.3456789 BTC
}
```





#### Order Book
Returns the current order book of Kraken in a custom organized object.
##### Input parameters
`baseCurrency`: The currency of baseAmount

`quoteCurrency`:  The currency to determine the price quoteCurrency/baseCurrency
##### Example call
```js
kraken.getOrderBook('BTC', 'USD', function (err, data) {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
  }
});
```
##### Response on success
```js
{
  baseCurrency: "BTC",
  quoteCurrency: "USD",
  asks: [                   // List of entries with bitcoins for sale, sorted by lowest price first
    {
      price: 450.65,
      baseAmount: 44556677  // 0.44556677 BTC for sale
    }
    // ... more ask entries
  ],
    bids: [                 // List of entries for buying bitcoins, sorted by most highest price first
      {
        price: 450.31,
        baseAmount: 33445566 // Someone wants to buy 0.33445566 BTC
      }
    // ... more bid entries
  ]
}
```

#### Account Balance
Returns the available and total balance amounts of the account.
##### Input parameters
*none*
##### Example call
```js
kraken.getBalance(function (err, data) {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
  }
});
```
##### Response on success
```js
{
  available: {
    USD: 123,       // 1.23 USD
    EUR: 321,       // 3.21 EUR
    BTC: 23000000   // 23 BTC
  }
  total: {
    USD: 245,
    EUR: 653
    BTC: 24000000
  }
}
```

#### Order Status
Fetches a trade object which contains the status and an array of the transactions to that trade, from Kraken.
Constructs and returns an object with trade currency pair and accummulated amounts from all transactions
of the trade.
##### Input parameters
An object that contains data about the trade to be fetched. Must have at least the following structure:

```js
trade: {
  raw: {
    id: 123456789,       // Obligatory
    orderType: 'sell',   // optional
    datetime: '2015-09-03T11:40:46.000Z' // optional. Can be ISO-8601, UNIX timestamp or YYYY-MM-DD format.
  }
  // You can also add any other parameters you wish.
}
```
##### Example call

```js
kraken.getTrade(trade, function (err, data) {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
  }
});
```
##### Response on success
```js
 {
    type: 'limit',
    state: closed',
    baseAmount: -200000000, // Sold 2.00000000 BTC...
    quoteAmount: 74526,     // ... for 745.26 USD
    baseCurrency: 'BTC'     // Currency of the baseAmount
    quoteCurrency: 'USD'    // Currency of the quoteAmount
    feeAmount: 11,          // Paid 0.11 USD to the exchange as commission for the order
    feeCurrency: 'USD',     // Currency of the feeAmount
    raw: {}                 // Exchange-specific object
 }
```

#### User Transactions
Returns a list of 'deposit' and 'withdrawal' type transaction objects, starting from the latest one, descending, fetched from your Kraken account.
If the `latestTransaction` is provided, then fetch the transactions from the provided one, onwards. This is made according to the logic that in your system you have the latest transaction, and you want to fetch all the transaction, from your Kraken account, that happened *after* this transaction.

If this object parameter is not provided (null), return *ALL* transactions from the account. This might take a minute, if you've got a lot (tens of thousands) of transactions in your account.

***NOTE:*** The Kraken API has a limit of 1000 objects per response and a limit of 600 requests per 10 min. If you are going to get a list of transactions starting from a very, very old transaction, and provided that you've got *many* transactions on your account (more than 600 000, and the tx you're looking for is older than that),
you risk to go over the requests limit and getting your API IP blocked from Kraken.

***NOTE:*** Due to the implementation of the Kraken API, this method will make n*2 HTTP requests, where n stands for the number of supported currencies as passed into the constructor.
##### Input parameters
An object that contains data about the latest trade fetched onwards from which to search for transactions. Must have at least the following structure:

```js
var latestTransaction = {
  raw: {
    id: 10170901,
    datetime: '2015-12-19T14:55:57.000Z' // Obligatory. This is ISO-8601 format, but can also be UNIX timestamp or YYY-mm-dd format
  }
};
```
##### Example call

```js
kraken.listTransactions(latestTransaction, function (err, data) {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
    console.log(data.length); // to see the number of transactions found
  }
});
```
##### Response on success
```js
[
  {
    externalId: '1234-2345-3456-4567',
    timestamp: '2015-12-19T14:55:57.000Z',
    state: 'relayed',
    amount: 400000,       // Transaction of 4,000.00 USD
    currency: 'USD',
    type: 'deposit',      // Transaction type. Can be 'deposit' or 'withdrawal'
    raw: {}
  },
  {
    externalId: '2345-3456-457-5678',
    timestamp: '2015-12-20T12:16:54.000Z',
    state: 'completed',
    amount: -2000000000, // Transaction of 20 BTC
    currency: 'BTC',
    type: 'withdrawal',
    raw: {}
   }
   // ... more transactions
]
```
#### Sell & Buy limit order (in one method)
Place a limit BUY or SELL trade (order), depending on the sign of the `baseAmount` argument.
SELL if amount is *negative*
BUY if amount is *positive*
##### Input parameters
{int} `baseAmount`: The amount in base currency to buy or sell on the exchange; If negative amount, place sell limit order. If positive amount, place buy limit order. Denominated in smallest sub-unit of the base currency

{float} `limitPrice`: The minimum/maximum rate that you want to sell/buy for. If baseAmount is negative, this is the minimum rate to sell for. If baseAmount is positive, this is the maximum rate to buy for. limitPrice must always strictly positive

{string} `baseCurrency`: The exchange's base currency. For Kraken it is always BTC

{string} `quoteCurrency`: The exchange's quote currency. For Kraken it is always USD

##### Example call
```js
kraken.placeTrade(-1250000, 460.00, 'BTC', 'USD', function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
});
```
##### Response on success
```js
{
  type: 'limit',
  state: 'open',
  baseAmount: 123456789,  // Buy 1.23456789 BTC
  baseCurrency: 'BTC',    // Currency of the baseAmount
  quoteCurrency: 'USD',   // Currency of the quoteAmount
  limitPrice: 500.00,     // Buy bitcoins at a maximum price of 500 USD/BTC
  raw: {
    orderType: 'buy'      // will be 'sell' if 'baseAmount' is negative
  }
}
```



Enjoy!

#### Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
