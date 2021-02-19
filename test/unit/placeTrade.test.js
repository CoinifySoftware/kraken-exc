const sinon = require('sinon');
const request = require('request');
const chai = require('chai');
const expect = chai.expect;
const chaiSubset = require('chai-subset');
const Kraken = require('../../index');
const Error = require('../../lib/ErrorHelper');

chai.use(chaiSubset);

describe('#placeTrade', function () {
  const kraken = new Kraken({
    key: 'apikey',
    secret: 'apisecret',
    otp: '2FA'
  });

  let reqStub,
    placeTradeResponse;

  beforeEach((done) => {
    placeTradeResponse = {
      error: [],
      result: {}
    };

    reqStub = sinon.stub(request, 'post');
    done();
  });

  afterEach((done) => {
    reqStub.restore();
    done();
  });

  it('should place ETH trade', (done) => {
    placeTradeResponse.result = {
      descr: { order: 'buy 0.01000000 ETHUSD @ limit 10000.000' },
      txid: [ 'OOWXPS-75QXE-6YRBUU' ]
    };
    reqStub.yields(null, {}, JSON.stringify(placeTradeResponse));

    kraken.placeTrade(10000000000, 10000.57, 'ETH', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(result).to.eql({
        externalId: 'OOWXPS-75QXE-6YRBUU',
        type: 'limit',
        state: 'open',
        baseAmount: 10000000000,
        baseCurrency: 'ETH',
        quoteCurrency: 'USD',
        limitPrice: 10000.6,
        raw: {
          descr: { order: 'buy 0.01000000 ETHUSD @ limit 10000.000' },
          txid: [ 'OOWXPS-75QXE-6YRBUU' ]
        }
      });

      expect(reqStub.firstCall.args[0].form).to.include({
        pair: 'XETHZUSD',
        type: 'buy',
        ordertype: 'limit',
        price: 10000.6,
        volume: 0.01,
        otp: '2FA'
      });

      done();
    });
  });

  it('places a SELL trade order on the exchange and returns a response object', (done) => {
    placeTradeResponse.result = {
      descr: { order: 'sell 0.01000000 XBTUSD @ limit 10000.000' },
      txid: [ 'OOWXPS-75QXE-6YRBUU' ]
    };
    reqStub.yields(null, {}, JSON.stringify(placeTradeResponse));

    kraken.placeTrade(-1000000, 10000.57, 'BTC', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          pair: 'XXBTZUSD',
          type: 'sell',
          ordertype: 'limit',
          price: 10000.6,
          volume: 0.01
        }
      });

      expect(result).to.be.an('Object');

      expect(result.id).to.be.an('undefined');
      expect(result.externalId).to.equal(placeTradeResponse.result.txid[0]);
      expect(result.type).to.equal('limit');
      expect(result.state).to.equal('open');
      expect(result.baseAmount).to.equal(-1000000);
      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteCurrency).to.equal('USD');
      expect(result.limitPrice).to.equal(10000.6);
      expect(result).to.have.property('raw');
      expect(result.raw).to.containSubset(placeTradeResponse.result);

      done();
    });
  });

  it('places a BUY trade order on the exchange and returns a response object', (done) => {
    placeTradeResponse.result = {
      descr: { order: 'buy 1.00000000 XBTUSD @ limit 100.000' },
      txid: [ 'OOWXPS-75QXE-6YRBUU' ]
    };
    reqStub.yields(null, {}, JSON.stringify(placeTradeResponse));

    kraken.placeTrade(100000000, 100.00, 'BTC', 'USD', function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          pair: 'XXBTZUSD',
          type: 'buy',
          ordertype: 'limit',
          price: 100,
          volume: 1
        }
      });

      expect(result).to.be.an('Object');

      expect(result.id).to.be.an('undefined');
      expect(result.externalId).to.equal(placeTradeResponse.result.txid[0]);
      expect(result.type).to.equal('limit');
      expect(result.state).to.equal('open');
      expect(result.baseAmount).to.equal(100000000);
      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteCurrency).to.equal('USD');
      expect(result.limitPrice).to.equal(100.00);
      expect(result).to.have.property('raw');
      expect(result.raw).to.containSubset(placeTradeResponse.result);

      done();
    });
  });

  it('should round to 1 decimails if provided limitPrice has 3 decimails', (done) => {
    placeTradeResponse.result = {
      descr: { order: 'buy 1.00000000 XBTUSD @ limit 100.000' },
      txid: [ 'OOWXPS-75QXE-6YRBUU' ]
    };
    reqStub.yields(null, {}, JSON.stringify(placeTradeResponse));

    kraken.placeTrade(100000000, 100.1259, 'BTC', 'USD', function (err) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          pair: 'XXBTZUSD',
          type: 'buy',
          ordertype: 'limit',
          price: 100.1,
          volume: 1
        }
      });

      done();
    });
  });

  /* =================   Testing wrong input to the endpoints   ================= */

  it('returns an error about wrong currency input arguments', (done) => {
    kraken.placeTrade(-123456, 460.84, 'bStc', 'EUR', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('Kraken only supports BTC or BSV as base currency and USD or EUR as quote currency.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('returns an error about wrong baseAmount input argument', (done) => {
    kraken.placeTrade(null, 460.84, 'BTC', 'USD', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('The base amount must be a number and larger or smaller than 0.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('returns an error about wrong limitPrice input argument when NULL is passed', (done) => {
    kraken.placeTrade(-123456, null, 'BTC', 'USD', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('The limit price must be a positive number.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('returns an error about wrong limitPrice input argument when negative amount is passed', (done) => {
    kraken.placeTrade(-123456, -100, 'BTC', 'USD', function (err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('The limit price must be a positive number.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

});
