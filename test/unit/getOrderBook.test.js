const sinon = require('sinon');
const request = require('request');
const expect = require('chai').expect;
const Kraken = require('../../index.js');
const Error = require('../../lib/ErrorHelper.js');

describe('#getOrderBook', function () {
  const kraken = new Kraken({
    key: 'apikey',
    secret: 'apisecret',
    otp: '2FA'
  });

  const getOrderBookResponse =
  {
    error: [],
    result: {
      XXBTZEUR: {
        bids: [
          [ '541.19000', '1.933', 1470576586 ],
          [ '541.19600', '4.275', 1470576476 ],
          [ '541.77000', '4.000', 1470576451 ]
        ],
        asks: [
          [ '540.00900', '3.044', 1470576289 ],
          [ '540.00200', '10.814', 1470575461 ],
          [ '540.00000', '19.430', 1470574993 ]
        ]
      }
    }
  };

  const getOrderBookAlternativeResponse =
  {
    error: [],
    result: {
      'BTC\/USD': {
        bids: [
          [ '541.19000', '1.933', 1470576586 ]
        ],
        asks: [
          [ '540.00900', '3.044', 1470576289 ]
        ]
      }
    }
  };


  const getOrderBookInvalidResponse =
  {
    error: [],
    result: {
      'what-is-this-pair?': {
        bids: [],
        asks: []
      }
    }
  };


  let reqStub;

  beforeEach(() => {
    reqStub = sinon.stub(request, 'get');
  });

  afterEach(() => {
    reqStub.restore();
  });

  /* =================   Testing response data consistency   ================= */

  it('should get order book for ETH', (done) => {
    const getOrderBookETHResponse = {
      error: [],
      result: {
        XETHZUSD: {
          bids: [
            [ '541.19000', '1.933', 1470576586 ],
            [ '541.19600', '4.275', 1470576476 ],
            [ '541.77000', '4.000', 1470576451 ]
          ],
          asks: [
            [ '540.00900', '3.044', 1470576289 ],
            [ '540.00200', '10.814', 1470575461 ],
            [ '540.00000', '19.430', 1470574993 ]
          ]
        }
      }
    };

    reqStub.yields(null, {}, JSON.stringify(getOrderBookETHResponse));

    kraken.getOrderBook('ETH', 'USD', (err, result) => {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'ETH',
        quoteCurrency: 'USD',
        bids: [
          { price: 541.19, baseAmount: 1933000000000 },
          { price: 541.196, baseAmount: 4275000000000 },
          { price: 541.77, baseAmount: 4000000000000 } ],
        asks: [
          { price: 540.009, baseAmount: 3044000000000 },
          { price: 540.002, baseAmount: 10814000000000 },
          { price: 540, baseAmount: 19430000000000 }
        ]
      });

      done();
    });
  });

  it('should return error when currency pair is not found in response', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getOrderBookInvalidResponse));

    kraken.getOrderBook('BTC', 'USD', function (err) {
      if (err) {
        expect(err.message).to.equal('Currency pair: XXBTZUSD is not in response');
        return done();
      }

      done('We expected a error');
    });
  });

  it('should access alternative currency pair in response', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getOrderBookAlternativeResponse));

    kraken.getOrderBook('BTC', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.be.an('Object');

      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteCurrency).to.equal('USD');

      expect(result).to.have.property('asks');
      expect(result).to.have.property('bids');

      expect(result.asks[0].price).to.equal(540.009);
      expect(result.asks[0].baseAmount).to.equal(304400000);

      expect(result.bids[0].price).to.equal(541.19);
      expect(result.bids[0].baseAmount).to.equal(193300000);

      done();
    });
  });

  it('should return a custom organized orderbook object', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getOrderBookResponse));

    kraken.getOrderBook('btc', 'eUR', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'XXBTZEUR' }, url: 'https://api.kraken.com/0/public/Depth' });

      expect(result).to.be.an('Object');

      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteCurrency).to.equal('EUR');

      expect(result).to.have.property('asks');
      expect(result).to.have.property('bids');

      expect(result.asks[0].price).to.equal(540.009);
      expect(result.asks[0].baseAmount).to.equal(304400000);
      expect(result.asks[1].price).to.equal(540.002);
      expect(result.asks[1].baseAmount).to.equal(1081400000);
      expect(result.asks[2].price).to.equal(540.0);
      expect(result.asks[2].baseAmount).to.equal(1943000000);

      expect(result.bids[0].price).to.equal(541.19);
      expect(result.bids[0].baseAmount).to.equal(193300000);
      expect(result.bids[1].price).to.equal(541.196);
      expect(result.bids[1].baseAmount).to.equal(427500000);
      expect(result.bids[2].price).to.equal(541.77);
      expect(result.bids[2].baseAmount).to.equal(400000000);

      done();
    });
  });

  it('should get order book for USDC', (done) => {
    const getOrderBookUSDCResponse = {
      error: [],
      result: {
        USDCUSD: {
          bids: [
            [ '0.99950000', '28987.147', 1688551241 ],
            [ '0.99940000', '100758.127', 1688551195 ],
            [ '0.99930000', '67178.494', 1688551034 ],
            [ '0.99910000', '283.773', 1688551240 ]
          ],
          asks: [
            [ '0.99990000', '810294.730', 1688551257 ],
            [ '1.00000000', '2699030.268', 1688551210 ],
            [ '1.00010000', '39054.677', 1688551203 ],
            [ '1.00020000', '878543.111', 1688550748 ]
          ]
        }
      }
    };

    reqStub.yields(null, {}, JSON.stringify(getOrderBookUSDCResponse));

    kraken.getOrderBook('USDC', 'USD', (err, result) => {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'USDC',
        quoteCurrency: 'USD',
        bids: [
          { price: 0.9995, baseAmount: 2898714700000 },
          { price: 0.9994, baseAmount: 10075812700000 },
          { price: 0.9993, baseAmount: 6717849400000 },
          { price: 0.9991, baseAmount: 28377300000 }
        ],
        asks: [
          { price: 0.9999, baseAmount: 81029473000000 },
          { price: 1, baseAmount: 269903026800000 },
          { price: 1.0001, baseAmount: 3905467700000 },
          { price: 1.0002, baseAmount: 87854311100000 }
        ]
      });

      done();
    });
  });

  it('should get order book for USDT', (done) => {
    const getOrderBookUSDTResponse = {
      error: [],
      result: {
        USDTZUSD: {
          bids: [
            [ '0.99950000', '28987.147', 1688551241 ],
            [ '0.99940000', '100758.127', 1688551195 ],
            [ '0.99930000', '67178.494', 1688551034 ],
            [ '0.99910000', '283.773', 1688551240 ]
          ],
          asks: [
            [ '0.99990000', '810294.730', 1688551257 ],
            [ '1.00000000', '2699030.268', 1688551210 ],
            [ '1.00010000', '39054.677', 1688551203 ],
            [ '1.00020000', '878543.111', 1688550748 ]
          ]
        }
      }
    };

    reqStub.yields(null, {}, JSON.stringify(getOrderBookUSDTResponse));

    kraken.getOrderBook('USDT', 'USD', (err, result) => {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'USDT',
        quoteCurrency: 'USD',
        bids: [
          { price: 0.9995, baseAmount: 2898714700000 },
          { price: 0.9994, baseAmount: 10075812700000 },
          { price: 0.9993, baseAmount: 6717849400000 },
          { price: 0.9991, baseAmount: 28377300000 }
        ],
        asks: [
          { price: 0.9999, baseAmount: 81029473000000 },
          { price: 1, baseAmount: 269903026800000 },
          { price: 1.0001, baseAmount: 3905467700000 },
          { price: 1.0002, baseAmount: 87854311100000 }
        ]
      });

      done();
    });
  });

  it('should get order book for TRX', (done) => {
    const getOrderBookTRXResponse = {
      error: [],
      result: {
        TRXUSD: {
          bids: [
            [ '0.1189270', '380803.755', 1712770715 ],
            [ '0.1189280', '1680.000', 1712770535 ],
            [ '0.1189290', '40843.231', 1712770715 ],
            [ '0.1189440', '12822.223', 1712770726 ]
          ],
          asks: [
            [ '0.1189260', '1680.200', 1712770300 ],
            [ '0.1188240', '407.508', 1712770717 ],
            [ '0.1188230', '30000.000', 1712770721 ],
            [ '0.1188220', '12623.876', 1712770709 ]
          ]
        }
      }
    };

    reqStub.yields(null, {}, JSON.stringify(getOrderBookTRXResponse));

    kraken.getOrderBook('TRX', 'USD', (err, result) => {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'TRX',
        quoteCurrency: 'USD',
        bids: [
          { price: 0.1189270, baseAmount: 380803755000 },
          { price: 0.1189280, baseAmount: 1680000000 },
          { price: 0.1189290, baseAmount: 40843231000 },
          { price: 0.1189440, baseAmount: 12822223000 }
        ],
        asks: [
          { price: 0.1189260, baseAmount: 1680200000 },
          { price: 0.1188240, baseAmount: 407508000 },
          { price: 0.1188230, baseAmount: 30000000000 },
          { price: 0.1188220, baseAmount: 12623876000 }
        ]
      });

      done();
    });
  });

  it('should get order book for EUR/ETH Inversed Pair', (done) => {
    const getOrderBookTRXResponse = {
      error: [],
      result: {
        XETHZEUR: {
          bids: [
            [ '8.42930354', '45307.408', 1712770715 ],
            [ '8.42924335', '199.749', 1712770535 ],
            [ '8.42918316', '4857.909', 1712770715 ],
            [ '8.42883493', '1524.687', 1712770726 ]
          ],
          asks: [
            [ '8.42930361', '45307.408', 1712770300 ],
            [ '8.42924288', '199.749', 1712770717 ],
            [ '8.42918271', '4857.909', 1712770721 ],
            [ '8.42883446', '1524.687', 1712770709 ]
          ]
        }
      }
    };

    reqStub.yields(null, {}, JSON.stringify(getOrderBookTRXResponse));

    kraken.getOrderBook('EUR', 'ETH', (err, result) => {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'EUR',
        quoteCurrency: 'ETH',
        asks: [
          { price: 0.11863376220233215, baseAmount: 38190991467275010000 },
          { price: 0.1186346169206599, baseAmount: 168374126528000000 },
          { price: 0.11863546376965414, baseAmount: 4094821097873609700 },
          { price: 0.11864036537265202, baseAmount: 1285135961281739800 }
        ],
        bids: [
          { price: 0.11863376318751004, baseAmount: 38190991150123130000 },
          { price: 0.11863461030579928, baseAmount: 168374135916250020 },
          { price: 0.1186354574361865, baseAmount: 4094821316479559700 },
          { price: 0.11864035875715032, baseAmount: 1285136032942170000 }
        ]
      });

      done();
    });
  });



  /* =================   Testing wrong input to the endpoint   ================= */

  it('should return an error about wrong currency input when baseCurrency is an invalid currency code', function (done) {
    kraken.getOrderBook('bStc', 'EUR', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.contain('Kraken only supports');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('should return an error about wrong currency input when quoteCurrency is DKK', function (done) {
    kraken.getOrderBook('BTC', 'DKK', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.contain('Kraken only supports');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });
});
