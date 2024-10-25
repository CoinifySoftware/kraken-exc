const sinon = require('sinon');
const request = require('request');
const expect = require('chai').expect;
const Kraken = require('../../index.js');

describe('#listTradeHistoryForPeriod', function () {
  const kraken = new Kraken({
    key: 'apikey',
    secret: 'apisecret',
    otp: '2FA'
  });

  let reqStub, getTradesResponse, trades;

  beforeEach((done) => {
    trades = {
      'TCWJEG-FL4SZ-3FKGH6': {
        ordertxid: 'OQCLML-BW3P3-BUCMWZ',
        postxid: 'TKH2SE-M7IF5-CFI7LT',
        pair: 'XETHZUSD',
        time: Date.now() / 1000,
        type: 'buy',
        ordertype: 'limit',
        price: '30010.00000',
        cost: '300.10000',
        fee: '0.00000',
        vol: '0.01000000',
        margin: '0.00000',
        misc: '',
        trade_id: 39482674,
        maker: true
      },
      'TAWJEG-FL4SZ-3FKGH6': {
        ordertxid: 'OACLML-BW3P3-BUCMWZ',
        postxid: 'TAH2SE-M7IF5-CFI7LT',
        pair: 'XXBTZUSD',
        time: Date.now() / 1000,
        type: 'buy',
        ordertype: 'limit',
        price: '3001.00000',
        cost: '300.10000',
        fee: '0.00000',
        vol: '0.01000000',
        margin: '0.00000',
        misc: '',
        trade_id: 39482674,
        maker: true
      },
      'TBWJEG-FL4SZ-3FKGH6': {
        ordertxid: 'OBCLML-BW3P3-BUCMWZ',
        postxid: 'TBH2SE-M7IF5-CFI7LT',
        pair: 'XETHZUSD',
        time: 0,
        type: 'buy',
        ordertype: 'limit',
        price: '3001.00000',
        cost: '300.10000',
        fee: '0.00000',
        vol: '0.01000000',
        margin: '0.00000',
        misc: '',
        trade_id: 39482674,
        maker: true
      },
      'TYWJEG-FL4SZ-3FKGH6': {
        ordertxid: 'OAELML-BW3P3-BUCMWZ',
        postxid: 'TAH2SE-MEIF5-CFI7LT',
        pair: 'XBTZUSD',
        time: Date.now() / 1000,
        type: 'sell',
        ordertype: 'limit',
        price: '3001.00000',
        cost: '300.10000',
        fee: '0.00000',
        vol: '0.01000000',
        margin: '0.00000',
        misc: '',
        trade_id: 39482674,
        maker: true
      },
      'TXWJEG-FL4SZ-3FKGH6': {
        ordertxid: 'OAELML-BW3P3-BUCMWZ',
        postxid: 'TAH2SE-MEIF5-CFI7LT',
        pair: 'XBTUSDC',
        time: Date.now() / 1000,
        type: 'sell',
        ordertype: 'limit',
        price: '3001.00000',
        cost: '300.10000',
        fee: '0.00000',
        vol: '0.01000000',
        margin: '0.00000',
        misc: '',
        trade_id: 39482674,
        maker: true
      }
    };
    getTradesResponse = {
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

  it('should make sure only Date instances are valid fromDateTime and toDateTime', () => {
    kraken.listTradeHistoryForPeriod('123', {}, function (err, trades) {
      expect(err.message).eql('fromDateTime and toDateTime must be an instance of Date.');
      expect(trades).eql(null);
    });
  });

  it('should only get trades in the given range ', () => {
    getTradesResponse.result = { trades };
    reqStub.yields(null, {}, JSON.stringify(getTradesResponse));

    const from = new Date();
    from.setTime(from.getTime() - 60 * 60 * 1000);

    const to = new Date();
    kraken.listTradeHistoryForPeriod(from, to, function (err, trades) {
      expect(reqStub.calledOnce).equal(true);
      expect(reqStub.firstCall.args[0]).containSubset({
        form: {
          start: from.getTime() / 1000,
          end: to.getTime() / 1000
        }
      });

      expect(err).eql(null);
      expect(trades).an('Array');
      expect(trades).length(4);

      //Should handle 3 lettered currencies
      expect(trades[2]).containSubset({
        baseCurrency: 'BTC',
        quoteCurrency: 'USD'
      });

      //Handle USDC
      expect(trades[3]).containSubset({
        baseCurrency: 'BTC',
        quoteCurrency: 'USDC'
      });
    });
  });
});
