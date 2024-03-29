const sinon = require('sinon');
const request = require('request');
const expect = require('chai').expect;
const Kraken = require('../../index.js');

describe('#getBalance', function () {
  const kraken = new Kraken({
    key: 'apikey',
    secret: 'apisecret'
  });

  let reqStub;

  beforeEach((done) => {
    reqStub = sinon.stub(request, 'post');
    done();
  });

  afterEach((done) => {
    reqStub.restore();
    done();
  });

  /* =================   Testing response data consistency   ================= */

  it('gets the balance of the account', function (done) {
    const getBalanceResponse = { error: [], result: { GLM: '0.0', ZUSD: '0.0', ZEUR: '5.0568', XXBT: '12.6721093800', XETH: '1.01', ZCAD: '2.02' } };
    const getOpenTradesResponse = {
      error: [],
      result: {
        open: {
          'SOME-TX-ID': {
            descr: {
              pair: 'XBTEUR',
              type: 'buy',
              price: '1.000',
              order: 'buy 4.00000000 XBTEUR @ limit 1.000'
            },
            vol: '4.00000000'
          },
          'SOME-OTHER-TX-ID': {
            descr: {
              pair: 'XBTUSD',
              type: 'sell',
              ordertype: 'limit',
              price: '100000.000',
              order: 'sell 1.00000000 XBTUSD @ limit 100000.000'
            },
            vol: '1.00000000'
          }
        }
      }
    };
    reqStub.onFirstCall().yields(null, {}, JSON.stringify(getBalanceResponse));
    reqStub.onSecondCall().yields(null, {}, JSON.stringify(getOpenTradesResponse));

    kraken.getBalance(function (err, result) {
      if (err) {
        return done(err);
      }

      expect(reqStub.calledTwice).to.equal(true);
      // no input arguments for either of the POST calls

      expect(result).to.be.an('Object');
      expect(result).to.have.property('available');
      expect(result).to.have.property('total');
      expect(result.available.USD).to.equal(0);
      expect(result.available.EUR).to.equal(406);
      expect(result.available.BTC).to.equal(1167210938);
      expect(result.available.ETH).to.equal(1.01e12);
      expect(result.available.CAD).to.equal(202);

      expect(result.total.USD).to.equal(0);
      expect(result.total.EUR).to.equal(506);
      expect(result.total.BTC).to.equal(1267210938);
      expect(result.total.ETH).to.equal(1.01e12);
      expect(result.available.CAD).to.equal(202);

      done();
    });
  });
});
