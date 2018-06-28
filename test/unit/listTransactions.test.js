"use strict";

const sinon = require('sinon'),
  request = require('../../lib/RequestHelper.js'),
  expect = require('chai').expect,
  _ = require('lodash'),
  Kraken = require('../../index.js');

describe('listTransactions', function () {
  const supportedCurrencies = ['ETH', 'ETC'];
  const krakenConfig = {
    key: "apikey",
    secret: "apisecret",
    otp: '2FA',
    host: 'host',
    timeout: 1000,
    supportedCurrencies
  };

  const kraken = new Kraken(krakenConfig);

  let reqStub
    , latestTransaction;

  beforeEach((done) => {
    reqStub = sinon.stub(request, 'post');
    done();
  });

  afterEach((done) => {
    reqStub.restore();
    done();
  });

  it('calls kraken api twice', function (done) {
    reqStub.yields(null, {ledger: {}});

    kraken.listTransactions(null, function (err, result) {
      expect(reqStub.callCount).to.equal(2);

      const firstCall = reqStub.getCall(0);
      expect(firstCall.args[1]).to.equal('Ledgers');
      expect(firstCall.args[2]).to.deep.equal({type: 'withdrawal', ofs: 0});

      const secondCall = reqStub.getCall(1);
      expect(secondCall.args[1]).to.equal('Ledgers');
      expect(secondCall.args[2]).to.deep.equal({type: 'deposit', ofs: 0});

      done();
    });
  });

  it('converts kraken api responses properly', function (done) {
    /*
     * Mock response from the withdrawal Ledgers endpoint
     */
    const withdrawalRawObject = {
      refid: 'ACLLUS5-JKRHGP-ZWWYSO',
      time: 1480675052.7086,
      type: 'withdrawal',
      aclass: 'currency',
      asset: 'ZUSD',
      amount: '-24952.5900',
      fee: '47.4100',
      balance: '4440.5843'
    };
    const withdrawalApiResponse =
    {
      ledger: {'LQ4LR7-6WL5O-Y4XDP3': withdrawalRawObject}
    };

    /*
     * Mock response from the deposit Ledgers endpoint
     */
    const depositRawObject =
    {
      refid: 'QGB2OUR-O5OQ6O-T5RZJF',
      time: 1420989927.5751,
      type: 'deposit',
      aclass: 'currency',
      asset: 'XXBT',
      amount: '0.0465757500',
      fee: '0.0000000000',
      balance: '8.3684639100'
    };
    const depositApiResponse =
    {
      ledger: {'G4HJR1-WWT7H-YH945H': depositRawObject}
    };

    /*
     * Define expected response from listTransactions()
     * Note that the deposit is the oldest, so it is returned first as per the API definition
     */
    const expectedConvertedResponse = [
      {
        externalId: 'QGB2OUR-O5OQ6O-T5RZJF',
        timestamp: '2015-01-11T15:25:27.575Z',
        state: 'completed',
        amount: 4657575,
        currency: 'BTC',
        type: 'deposit',
        raw: depositRawObject
      }, {
        externalId: 'ACLLUS5-JKRHGP-ZWWYSO',
        timestamp: '2016-12-02T10:37:32.708Z',
        state: 'completed',
        amount: -2495259,
        currency: 'USD',
        type: 'withdrawal',
        raw: withdrawalRawObject
      }
    ];

    const withdrawalReqStub = reqStub.withArgs(sinon.match.any, 'Ledgers', sinon.match({type: 'withdrawal'}));
    withdrawalReqStub.onCall(0).yields(null, withdrawalApiResponse);
    withdrawalReqStub.onCall(1).yields(null, {ledger: {}});

    const depositReqStub = reqStub.withArgs(sinon.match.any, 'Ledgers', sinon.match({type: 'deposit'}));
    depositReqStub.onCall(0).yields(null, depositApiResponse);
    depositReqStub.onCall(1).yields(null, {ledger: {}});

    kraken.listTransactions(null, function (err, result) {
      expect(result).to.deep.equal(expectedConvertedResponse);

      done();
    });
  });

  it('calls the API multiple times to get all transactions', function (done) {
    /*
     * Generate responses to trigger multiple requests.
     * When testing, the Kraken API returned 50 ledger entries as the maximum, so we'll generate responses
     * that each return 50 entries, and then one (the last) which returns fewer than 50
     */
    // withdrawal call returns an empty list, we only test the deposits here
    reqStub.withArgs(sinon.match.any, 'Ledgers', sinon.match({type: 'withdrawal'})).yields(null, {ledger: {}});

    const depositRawObject =
    {
      refid: 'QGB2OUR-O5OQ6O-T5RZJF',
      time: 1420989927.5751,
      type: 'deposit',
      aclass: 'currency',
      asset: 'XXBT',
      amount: '0.0465757500',
      fee: '0.0000000000',
      balance: '8.3684639100'
    };
    const depositReqStub = reqStub.withArgs(sinon.match.any, 'Ledgers', sinon.match({type: 'deposit'}));

    /*
    * Create 4 responses that 3 of them return max entries last one returns empty ledger
    * to stop the requests
    */
    for (let i = 0; i < 4; i++) {
      const response = {ledger: {}};

      if (i < 3) {
        for (let n = 0; n < 50; n++) {
          const id = '123456-78901-00' + i + '0' + n;
          const refid = '1234567-123456-00' + i + '0' + n;
          response.ledger[id] = _.defaults({refid}, depositRawObject);
        }
      }

      depositReqStub.onCall(i).yields(null, response);
    }

    // Last response that returns just a empty object
    depositReqStub.onCall(3).yields(null, {ledger: {}});

    /*
     * Call the API and expect to get (50*3 + 1) = 151 deposit transactions back
     */
    return kraken.listTransactions(null, function (err, result) {
      expect(err).to.equal(null);

      expect(result).to.have.lengthOf(150);
      expect(_.every(result, tx => tx.type === 'deposit')).to.equal(true);

      // 1 withdrawal call, 4 deposit calls
      expect(reqStub.callCount).to.equal(5);
      expect(reqStub.firstCall.args[1]).to.equal('Ledgers');
      expect(reqStub.firstCall.args[2]).to.deep.equal({type: 'withdrawal', ofs: 0});
      [1, 2, 3, 4].forEach(i => {
        expect(reqStub.getCall(i).args[1]).to.equal('Ledgers');
        const offset = (i-1)*50;
        expect(reqStub.getCall(i).args[2]).to.deep.equal({type: 'deposit', ofs: offset});
      });

      done();
    });
  });

  it('queries ledger entries after the one in the latestTransaction argument', function (done) {
    reqStub.yields(null, {ledger: {}});

    const latestTransaction =
    {
      externalId: 'QGB2OUR-O5OQ6O-T5RZJF',
      timestamp: '2015-01-11T15:25:27.575Z',
      state: 'completed',
      amount: 4657575,
      currency: 'BTC',
      type: 'deposit',
      raw: {
        refid: 'QGB2OUR-O5OQ6O-T5RZJF',
        time: 1420989927.5751,
        type: 'deposit',
        aclass: 'currency',
        asset: 'XXBT',
        amount: '0.0465757500',
        fee: '0.0000000000',
        balance: '8.3684639100'
      }
    };

    return kraken.listTransactions(latestTransaction, function(err, result) {
      expect(err).to.equal(null);

      expect(result).to.have.lengthOf(0);

      expect(reqStub.calledTwice).to.equal(true);
      const start = Math.trunc(latestTransaction.raw.time);
      expect(reqStub.firstCall.args[2].start).to.equal(start);
      expect(reqStub.secondCall.args[2].start).to.equal(start);

      done();
    });
  });

  it('propagates kraken api error properly', function (done) {
    const someError = new Error('sth broke');
    reqStub.onCall(1).yields(someError);
    reqStub.yields(null, {ledger: {}});

    kraken.listTransactions(null, function (err, result) {
      expect(err).to.equal(someError);

      done();
    });
  });
});
