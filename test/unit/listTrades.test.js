const sinon = require('sinon');
const request = require('request');
const expect = require('chai').expect;
const Kraken = require('../../index.js');

describe('#listTrades', function () {
  const kraken = new Kraken({
    key: 'apikey',
    secret: 'apisecret',
    otp: '2FA'
  });

  let reqStub, getTradesResponse, trades, expectedTrades;

  beforeEach(() => {
    expectedTrades = [
      {
        baseCurrency: 'ETH',
        quoteCurrency: 'USD'
      },
      {
        baseCurrency: 'BTC',
        quoteCurrency: 'USD'
      },
      {
        baseCurrency: 'ETH',
        quoteCurrency: 'EUR'
      },
      {
        baseCurrency: 'EUR',
        quoteCurrency: 'ETH'
      }
    ];

    trades = {
      'UYWJEG-FL4SZ-3FKGH6': {
        ordertxid: 'OAELML-BW3P3-BUCMWZ',
        postxid: 'TAH2SE-MEIF5-CFI7LT',
        pair: 'XETHZUSD',
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
      'OO3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'XETHZEUR',
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      },
      'KYUEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'ZEURXETH',
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      }
    };
    getTradesResponse = {
      error: [],
      result: {}
    };
    reqStub = sinon.stub(request, 'post');
  });

  afterEach(() => {
    reqStub.restore();
  });

  it('should get the earliest trade possible if nothing is passed to the latestTrade argument', async () => {
    getTradesResponse.result = { trades };
    reqStub.yields(null, {}, JSON.stringify(getTradesResponse));

    const krakenTrades = await kraken.listTrades();
    expect(krakenTrades).containSubset(expectedTrades);
  });

  it('should only get trades in the given range ', async () => {
    getTradesResponse.result = { trades };
    reqStub.yields(null, {}, JSON.stringify(getTradesResponse));

    const from = new Date();
    // Outside the 24-hour period
    from.setTime(from.getTime() - 25 * 60 * 60 * 1000);

    const krakenTrades = await kraken.listTrades({ createTime: from });

    expect(reqStub.calledOnce).equal(true);
    expect(reqStub.firstCall.args[0]).containSubset({
      form: {
        start: from.getTime() / 1000
      }
    });

    expect(krakenTrades).an('Array');
    expect(krakenTrades).length(expectedTrades.length);//Skip the one not within the time
    expect(krakenTrades).containSubset(expectedTrades);
  });
  it('should decrease 24h from the latestTxDate if it is within the last 24 hours ', async () => {
    getTradesResponse.result = { trades };
    reqStub.yields(null, {}, JSON.stringify(getTradesResponse));

    const from = new Date();
    from.setTime(from.getTime() - 20 * 60 * 60 * 1000);

    const expectedTime = new Date(from.getTime() - 24 * 60 * 60 * 1000);
    const krakenTrades = await kraken.listTrades({ createTime: from });

    expect(reqStub.calledOnce).equal(true);
    expect(reqStub.firstCall.args[0]).containSubset({
      form: {
        start: expectedTime.getTime() / 1000
      }
    });

    expect(krakenTrades).an('Array');
  });
});
