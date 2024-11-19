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
        baseCurrency: 'EUR',
        quoteCurrency: 'USD'
      },
      {
        baseCurrency: 'BTC',
        quoteCurrency: 'USD'
      },
      {
        baseCurrency: 'BTC',
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
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR'
      },
      {
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR'
      },
      {
        baseCurrency: 'EUR',
        quoteCurrency: 'USDC'
      },
      {
        baseCurrency: 'EUR',
        quoteCurrency: 'TRX'
      },
      {
        baseCurrency: 'EUR',
        quoteCurrency: 'ALGO'
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
      '0000-0000-0000-0000': {
        ordertxid: 'OQCLML-BW3P3-BUCMWZ',
        postxid: 'TKH2SE-M7IF5-CFI7LT',
        pair: 'XETHZUSD',
        time: 0,
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
        pair: 'ZEURZUSD',
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
      'TXWJEG-FL4SZ-3FKYH6': {
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
      'OOEEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'USDCZEUR',
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      },
      'OOUEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'USDCEUR', //Somehow, the kraken endpoint provides this asset pair when fetching trades.
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      },
      'EOUEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'EURUSDC', //Somehow, the kraken endpoint provides this asset pair when fetching trades.
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      },
      'IOUEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'ZEURTRX',
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      },
      'ROUEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'ZEURALGO',
        type: 'buy',
        ordertype: 'limit',
        price: '2333.92',
        status: 'closed'
      },
      'KOUEE3QCQ-SOJXH-NWMZZF': {
        fee: '104.68207',
        vol: '24.91800000',
        cost: '58156.69775',
        time: Date.now() / 1000,
        pair: 'ETHEUR',
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
        pair: 'EURETH',
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
    const krakenTrades = await kraken.listTrades({ createTime: new Date });
    expect(krakenTrades).containSubset([ {
      baseCurrency: 'ETH',
      quoteCurrency: 'USD'
    }, ...expectedTrades ]);
  });

  it('should only get trades in the given range ', async () => {
    getTradesResponse.result = { trades };
    reqStub.yields(null, {}, JSON.stringify(getTradesResponse));

    const from = new Date();
    from.setTime(from.getTime() - 60 * 60 * 1000);

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
});
