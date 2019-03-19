"use strict";
const sinon = require('sinon'),
  request = require('request'),
  expect = require('chai').expect,
  Kraken = require('../../index.js'),
  Error = require('../../lib/ErrorHelper.js');

describe('#getTicker', function () {
  const kraken = new Kraken({
    key: "apikey",
    secret: "apisecret",
    otp: '2FA'
  });

  const getTickerResponse =
  {
    error: [],
    result: {
      XXBTZEUR: {
        a: ['508.00000', '3', '3.000'],
        b: ['506.20000', '18', '18.000'],
        c: ['507.99900', '0.05576195'],
        v: ['2013.76979306', '4173.76106173'],
        p: ['505.96555', '506.24916'],
        t: [2756, 5473],
        l: ['503.03200', '501.11000'],
        h: ['509.92000', '509.92000'],
        o: '507.90800'
      },
      XXBTZUSD: {
        a: ['508.00000', '3', '3.000'],
        b: ['506.20000', '18', '18.000'],
        c: ['507.99900', '0.05576195'],
        v: ['2013.76979306', '4173.76106173'],
        p: ['505.96555', '506.24916'],
        t: [2756, 5473],
        l: ['503.03200', '501.11000'],
        h: ['509.92000', '509.92000'],
        o: '507.90800'
      },
      BSVEUR: {
        a: ['508.00000', '3', '3.000'],
        b: ['506.20000', '18', '18.000'],
        c: ['507.99900', '0.05576195'],
        v: ['2013.76979306', '4173.76106173'],
        p: ['505.96555', '506.24916'],
        t: [2756, 5473],
        l: ['503.03200', '501.11000'],
        h: ['509.92000', '509.92000'],
        o: '507.90800'
      },
      BSVUSD: {
        a: ['508.00000', '3', '3.000'],
        b: ['506.20000', '18', '18.000'],
        c: ['507.99900', '0.05576195'],
        v: ['2013.76979306', '4173.76106173'],
        p: ['505.96555', '506.24916'],
        t: [2756, 5473],
        l: ['503.03200', '501.11000'],
        h: ['509.92000', '509.92000'],
        o: '507.90800'
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

  it('should return a custom formatted ticker object', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('btc', 'eUR', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {pair: 'XXBTZEUR'}, url: 'https://api.kraken.com/0/public/Ticker'});

      expect(result).to.be.an('Object');

      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteCurrency).to.equal('EUR');

      expect(result).to.deep.equal({
        baseCurrency: 'BTC',
        quoteCurrency: 'EUR',
        bid: 506.20000,
        ask: 508.00000,
        lastPrice: 507.99900,
        high24Hours: 509.92000,
        low24Hours: 501.11000,
        vwap24Hours: 506.24916,
        volume24Hours: 417376106173
      });

      done();
    });
  });

  /* =================   Testing valid pairs   ================= */

  it('should return a response for the currency pair BTC/USD', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('BTC', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {pair: 'XXBTZUSD'}, url: 'https://api.kraken.com/0/public/Ticker'});

      expect(result).to.be.an('Object');

      done();
    });
  });

  it('should return a response for the currency pair BSV/EUR', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('BSV', 'EUR', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {pair: 'BSVEUR'}, url: 'https://api.kraken.com/0/public/Ticker'});

      expect(result).to.be.an('Object');

      done();
    });
  });

  it('should return a response for the currency pair BSV/USD', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('BSV', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }
      
      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {pair: 'BSVUSD'}, url: 'https://api.kraken.com/0/public/Ticker'});

      expect(result).to.be.an('Object');

      done();
    });
  });

  /* =================   Testing wrong input to the endpoint   ================= */

  it('should return an error about wrong currency input when baseCurrency is an invalid currency code', function (done) {
    kraken.getTicker('bStc', 'EUR', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('Kraken only supports BTC or BSV as base currency and USD or EUR as quote currency.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('should return an error about wrong currency input when quoteCurrency is DKK', function (done) {
    kraken.getTicker('bStc', 'DKK', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('Kraken only supports BTC or BSV as base currency and USD or EUR as quote currency.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

});
