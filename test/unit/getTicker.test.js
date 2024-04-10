const sinon = require('sinon');
const request = require('request');
const expect = require('chai').expect;
const Kraken = require('../../index.js');
const Error = require('../../lib/ErrorHelper.js');

describe('#getTicker', function () {
  const kraken = new Kraken({
    key: 'apikey',
    secret: 'apisecret',
    otp: '2FA'
  });

  const getTickerResponse =
  {
    error: [],
    result: {
      XXBTZEUR: {
        a: [ '508.00000', '3', '3.000' ],
        b: [ '506.20000', '18', '18.000' ],
        c: [ '507.99900', '0.05576195' ],
        v: [ '2013.76979306', '4173.76106173' ],
        p: [ '505.96555', '506.24916' ],
        t: [ 2756, 5473 ],
        l: [ '503.03200', '501.11000' ],
        h: [ '509.92000', '509.92000' ],
        o: '507.90800'
      },
      XXBTZUSD: {
        a: [ '508.00000', '3', '3.000' ],
        b: [ '506.20000', '18', '18.000' ],
        c: [ '507.99900', '0.05576195' ],
        v: [ '2013.76979306', '4173.76106173' ],
        p: [ '505.96555', '506.24916' ],
        t: [ 2756, 5473 ],
        l: [ '503.03200', '501.11000' ],
        h: [ '509.92000', '509.92000' ],
        o: '507.90800'
      },
      XETHZUSD: {
        a: [ '508.00000', '3', '3.000' ],
        b: [ '506.20000', '18', '18.000' ],
        c: [ '507.99900', '0.05576195' ],
        v: [ '2013.76979306', '4173.76106173' ],
        p: [ '505.96555', '506.24916' ],
        t: [ 2756, 5473 ],
        l: [ '503.03200', '501.11000' ],
        h: [ '509.92000', '509.92000' ],
        o: '507.90800'
      },
      BSVEUR: {
        a: [ '508.00000', '3', '3.000' ],
        b: [ '506.20000', '18', '18.000' ],
        c: [ '507.99900', '0.05576195' ],
        v: [ '2013.76979306', '4173.76106173' ],
        p: [ '505.96555', '506.24916' ],
        t: [ 2756, 5473 ],
        l: [ '503.03200', '501.11000' ],
        h: [ '509.92000', '509.92000' ],
        o: '507.90800'
      },
      BSVUSD: {
        a: [ '508.00000', '3', '3.000' ],
        b: [ '506.20000', '18', '18.000' ],
        c: [ '507.99900', '0.05576195' ],
        v: [ '2013.76979306', '4173.76106173' ],
        p: [ '505.96555', '506.24916' ],
        t: [ 2756, 5473 ],
        l: [ '503.03200', '501.11000' ],
        h: [ '509.92000', '509.92000' ],
        o: '507.90800'
      },
      USDCUSD: {
        a: [ '0.99970000', '16256', '16256.000' ],
        b: [ '0.99950000', '104', '104.000' ],
        c: [ '0.99950000', '114.29282439' ],
        v: [ '3752536.94631957', '8064321.95581636' ],
        p: [ '0.99960921', '0.99973907' ],
        t: [ 1600, 3697 ],
        l: [ '0.99900000', '0.99900000' ],
        h: [ '0.99980000', '1.00000000' ],
        o: '0.99970000'
      },
      TRXUSD: {
        a: [ '0.1191850', '30000', '30000.000' ],
        b: [ '0.1191310', '5647', '5647.000' ],
        c: [ '0.1191750', '359.37203300' ],
        v: [ '17265319.40005965', '18011212.83474792' ],
        p: [ '0.1208644', '0.1208695' ], t: [ 1590, 1964 ],
        l: [ '0.1178630', '0.1178630' ],
        h: [ '0.1239300', '0.1239300' ], o: '0.1209670' }
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

  it('should get ticket data for ETH', (done) => {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('ETH', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'ETH',
        quoteCurrency: 'USD',
        bid: 506.2,
        ask: 508,
        lastPrice: 507.999,
        high24Hours: 509.92,
        low24Hours: 501.11,
        vwap24Hours: 506.24916,
        volume24Hours: 4173761061730000
      });

      done();
    });
  });

  it('should return a custom formatted ticker object', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('btc', 'eUR', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'XXBTZEUR' }, url: 'https://api.kraken.com/0/public/Ticker' });

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

  it('should get ticket data for USDC', (done) => {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('USDC', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        baseCurrency: 'USDC',
        quoteCurrency: 'USD',
        bid: 0.9995,
        ask: 0.9997,
        lastPrice: 0.9995,
        high24Hours: 1,
        low24Hours: 0.999,
        vwap24Hours: 0.99973907,
        volume24Hours: 806432195581636
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
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'XXBTZUSD' }, url: 'https://api.kraken.com/0/public/Ticker' });

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
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'BSVEUR' }, url: 'https://api.kraken.com/0/public/Ticker' });

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
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'BSVUSD' }, url: 'https://api.kraken.com/0/public/Ticker' });

      expect(result).to.be.an('Object');

      done();
    });
  });

  it('should return a response for the currency pair USDC/USD', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('USDC', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'USDCUSD' }, url: 'https://api.kraken.com/0/public/Ticker' });

      expect(result).to.be.an('Object');

      done();
    });
  });

  it('should return a response for the currency pair TRX/USD', function (done) {
    reqStub.yields(null, {}, JSON.stringify(getTickerResponse));

    kraken.getTicker('TRX', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({ qs: { pair: 'TRXUSD' }, url: 'https://api.kraken.com/0/public/Ticker' });

      expect(result).to.be.an('Object');

      done();
    });
  });

  /* =================   Testing wrong input to the endpoint   ================= */

  it('should return an error about wrong currency input when baseCurrency is an invalid currency code', function (done) {
    kraken.getTicker('bStc', 'EUR', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.contain('Kraken only supports BTC');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('should return an error about wrong currency input when quoteCurrency is DKK', function (done) {
    kraken.getTicker('bStc', 'DKK', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.contain('Kraken only supports BTC');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

});
