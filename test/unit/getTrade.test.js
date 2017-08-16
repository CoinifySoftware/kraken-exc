"use strict";
const sinon = require('sinon'),
  request = require('request'),
  expect = require('chai').expect,
  Kraken = require('../../index.js'),
  Error = require('../../lib/ErrorHelper.js');

describe('#getTrade', function() {
  const kraken = new Kraken({
    key: "apikey",
    secret: "apisecret",
    otp: '2FA'
  });

  let reqStub, getTradeResponse, trade, openOrder, closedOrder, tradeValues, closedOrderValues, openOrderValues, cancelledOrderValues;

  beforeEach((done) => {
    trade = {
      raw: {
        txid: ['TEBCPN-YCQ7U-PQSUJF'],
        orderType: 'sell',
        createTime: '2015-09-03 11:40:46'
      }
    };

    openOrder = {
      raw: {
        txid: ['OEX7R7-ID6ZP-KATRCD'],
        orderType: 'sell',
        createTime: '2015-09-03 11:40:46'
      }
    };

    closedOrder = {
      raw: {
        txid: ['OEX7R7-ID6ZP-KATRCC'],
        orderType: 'sell',
        createTime: '2015-09-03 11:40:46'
      }
    };

    tradeValues = {
      'TEBCPN-YCQ7U-PQSUJF': {
        pair: 'XXBTZEUR',
        type: 'sell',
        ordertype: 'limit',
        cost: '507.00000',
        fee: '0.01318',
        vol: '0.01000000'
      }
    };

    openOrderValues = {
      'OEX7R7-ID6ZP-KATRCD': {
        status: 'open',
        descr: {
          pair: 'XBTEUR',
          type: 'buy',
          ordertype: 'limit',
          leverage: 'none',
          order: 'buy 4.00000000 XBTEUR @ limit 1.000'
        },
        cost: '1.000',
        vol: '4.00000000',
        fee: '0.00000'
      }
    };

    closedOrderValues = {
      'OEX7R7-ID6ZP-KATRCC': {
        status: 'closed',
        descr: {
          pair: 'XBTEUR',
          type: 'buy',
          ordertype: 'limit',
          leverage: 'none',
          order: 'buy 4.00000000 XBTEUR @ limit 1.000'
        },
        cost: '1.000',
        vol: '4.00000000',
        fee: '0.00000'
      }
    };

    cancelledOrderValues = {
      'OEX7R7-ID6ZP-KATRCD': {
        status: 'canceled',
        descr: {
          pair: 'XBTEUR',
          type: 'buy',
          ordertype: 'limit',
          leverage: 'none',
          order: 'buy 4.00000000 XBTEUR @ limit 1.000'
        },
        vol: '0.04478029',
        cost: '0.00000',
        fee: '0.00000'
      }
    }

    getTradeResponse = {
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

  /* =================   Testing response data consistency   ================= */

  it('gets the requested SELL trade', function(done) {
    getTradeResponse.result = tradeValues;
    reqStub.yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(trade, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          txid: 'TEBCPN-YCQ7U-PQSUJF'
        }
      });

      expect(result).to.be.an('Object');

      expect(result.id).to.be.an('undefined');
      expect(result.externalId).to.equal(trade.raw.txid[0]);
      expect(result.type).to.equal('limit');
      expect(result.state).to.equal('closed');
      expect(result.baseAmount).to.equal(-1000000);
      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteAmount).to.equal(50700);
      expect(result.quoteCurrency).to.equal('EUR');
      expect(result.feeAmount).to.equal(1);
      expect(result.feeCurrency).to.equal('EUR');
      expect(result.raw).to.deep.equal(getTradeResponse.result);

      done();
    });
  });

  it('gets the requested BUY trade', function(done) {
    getTradeResponse.result = tradeValues;
    getTradeResponse.result[trade.raw.txid[0]].type = 'buy';
    reqStub.yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(trade, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          txid: 'TEBCPN-YCQ7U-PQSUJF'
        }
      });

      expect(result).to.be.an('Object');

      expect(result).to.have.property('baseAmount');
      expect(result.externalId).to.equal(trade.raw.txid[0]);
      expect(result.baseAmount).to.equal(1000000);
      expect(result.quoteAmount).to.equal(-50700);
      expect(result.feeAmount).to.equal(1);
      expect(result.raw).to.deep.equal(getTradeResponse.result);

      done();
    });
  });

  it('gets the requested SELL open order', function(done) {
    getTradeResponse.result = openOrderValues;
    getTradeResponse.result[openOrder.raw.txid[0]].descr.type = 'sell';
    reqStub.onFirstCall().yields(null, {}, JSON.stringify({
      error: ['EOrder:Invalid order']
    }));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(openOrder, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledTwice).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          txid: 'OEX7R7-ID6ZP-KATRCD'
        }
      });

      expect(result).to.be.an('Object');

      expect(result.id).to.be.an('undefined');
      expect(result.externalId).to.equal(openOrder.raw.txid[0]);
      expect(result.type).to.equal('limit');
      expect(result.state).to.equal('open');
      expect(result.baseAmount).to.equal(-400000000);
      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteAmount).to.equal(null);
      expect(result.quoteCurrency).to.equal('EUR');
      expect(result.feeAmount).to.equal(null);
      expect(result.feeCurrency).to.equal('EUR');
      expect(result.raw).to.deep.equal(getTradeResponse.result);

      done();
    });
  });

  it('gets the requested BUY open order', function(done) {
    getTradeResponse.result = openOrderValues;
    reqStub.onFirstCall().yields(null, {}, JSON.stringify({
      error: ['EOrder:Invalid order']
    }));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(openOrder, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledTwice).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          txid: 'OEX7R7-ID6ZP-KATRCD'
        }
      });

      expect(result).to.be.an('Object');

      expect(result).to.have.property('baseAmount');
      expect(result.externalId).to.equal(openOrder.raw.txid[0]);
      expect(result.baseAmount).to.equal(400000000);
      expect(result.quoteAmount).to.equal(null);
      expect(result.feeAmount).to.equal(null);
      expect(result.raw).to.deep.equal(getTradeResponse.result);

      done();
    });
  });

  it('gets the requested SELL closed order', function(done) {
    getTradeResponse.result = closedOrderValues;
    getTradeResponse.result[closedOrder.raw.txid[0]].descr.type = 'sell';
    reqStub.onFirstCall().yields(null, {}, JSON.stringify({
      error: ['EOrder:Invalid order']
    }));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(closedOrder, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledTwice).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          txid: 'OEX7R7-ID6ZP-KATRCC'
        }
      });

      expect(result).to.be.an('Object');

      expect(result.id).to.be.an('undefined');
      expect(result.externalId).to.equal(closedOrder.raw.txid[0]);
      expect(result.type).to.equal('limit');
      expect(result.state).to.equal('closed');
      expect(result.baseAmount).to.equal(-400000000);
      expect(result.baseCurrency).to.equal('BTC');
      expect(result.quoteAmount).to.equal(100);
      expect(result.quoteCurrency).to.equal('EUR');
      expect(result.feeAmount).to.equal(0);
      expect(result.feeCurrency).to.equal('EUR');
      expect(result.raw).to.deep.equal(getTradeResponse.result);

      done();
    });
  });

  it('gets the requested BUY closed order', function(done) {
    getTradeResponse.result = closedOrderValues;
    reqStub.onFirstCall().yields(null, {}, JSON.stringify({
      error: ['EOrder:Invalid order']
    }));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(closedOrder, function(err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledTwice).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({
        form: {
          otp: '2FA',
          txid: 'OEX7R7-ID6ZP-KATRCC'
        }
      });

      expect(result).to.be.an('Object');

      expect(result).to.have.property('baseAmount');
      expect(result.externalId).to.equal(closedOrder.raw.txid[0]);
      expect(result.baseAmount).to.equal(400000000);
      expect(result.quoteAmount).to.equal(-100);
      expect(result.feeAmount).to.equal(0);
      expect(result.raw).to.deep.equal(getTradeResponse.result);

      done();
    });
  });
  /* =================   Testing wrong input to the endpoint   ================= */

  it('returns an error about missing required trade object input argument', function(done) {
    reqStub.yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(null, function(err, result) {
      expect(reqStub.calledOnce).to.equal(false);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('Trade object is a required parameter.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('returns an error about missing required trade.raw property input argument', function(done) {
    delete trade.raw;

    kraken.getTrade(trade, function(err, result) {
      expect(reqStub.notCalled).to.equal(true);
      expect(result).to.equal(undefined);

      expect(err.message).to.equal('\'trade.raw\' is a required property.');
      expect(err.code).to.equal(Error.MODULE_ERROR);
      expect(err.cause).to.equal(undefined);

      done();
    });
  });

  it('should return error if response from kraken exchange is empty for open order', (done) => {
    reqStub.onFirstCall().yields(null, {}, JSON.stringify({
      error: ['EOrder:Invalid order']
    }));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(openOrder, (err) => {
      expect(err.message).to.equal('Response from kraken is empty.');
      expect(err.code).to.equal(Error.EXCHANGE_SERVER_ERROR);
      expect(err.cause).to.equal(undefined);
      done();
    })
  });

  it('should return state \'cancelled\' if order has been cancelled', (done) => {
    getTradeResponse.result = cancelledOrderValues;
    reqStub.onFirstCall().yields(null, {}, JSON.stringify({
      error: ['EOrder:Invalid order']
    }));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getTradeResponse));

    kraken.getTrade(openOrder, function(err, result) {
      if (err) {
        return done(err);
      }
      expect(result.state).to.equal('cancelled');
      done();
    });
  });
});
