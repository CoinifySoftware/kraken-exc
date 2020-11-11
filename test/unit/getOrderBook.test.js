"use strict";
const sinon = require('sinon'),
  request = require('request'),
  expect = require('chai').expect,
  Kraken = require('../../index.js'),
  Error = require('../../lib/ErrorHelper.js');

describe('#getOrderBook', function () {
  const kraken = new Kraken({
    key: "apikey",
    secret: "apisecret",
    otp: '2FA'
  });

  const getOrderBookResponse =
  {
    error: [],
    result: {
      'XXBTZEUR': {
        bids: [
          ['541.19000', '1.933', 1470576586],
          ['541.19600', '4.275', 1470576476],
          ['541.77000', '4.000', 1470576451]
        ],
        asks: [
          ['540.00900', '3.044', 1470576289],
          ['540.00200', '10.814', 1470575461],
          ['540.00000', '19.430', 1470574993]
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
          ['541.19000', '1.933', 1470576586]
        ],
        asks: [
          ['540.00900', '3.044', 1470576289]
        ]
      }
    }
  };


  const getOrderBookInvalidResponse =
  {
    error: [],
    result: {
      'what-is-this-pair?': {
        bids:[],
        asks:[]
      }
    }
  };


  let reqStub;

  beforeEach(() => {
    reqStub = sinon.stub(request, 'post');
  });

  afterEach(() => {
    reqStub.restore();
  });

  /* =================   Testing response data consistency   ================= */

  it('should return error when currency pair is not found in response', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getOrderBookInvalidResponse));

    kraken.getOrderBook('BTC', 'USD', function (err, result) {
      if (err) {
        expect(err.message).to.equal('Currency pair: XXBTZUSD is not in response')
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
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {pair: 'XXBTZEUR'}, url: 'https://api.kraken.com/0/public/Depth'});

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

  /* =================   Testing wrong input to the endpoint   ================= */

  it('should return an error about wrong currency input when baseCurrency is an invalid currency code', function (done) {
    kraken.getOrderBook('bStc', 'EUR', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('Kraken only supports BTC or BSV as base currency and USD or EUR as quote currency.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('should return an error about wrong currency input when quoteCurrency is DKK', function (done) {
    kraken.getOrderBook('BTC', 'DKK', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('Kraken only supports BTC or BSV as base currency and USD or EUR as quote currency.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

});
