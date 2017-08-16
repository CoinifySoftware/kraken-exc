"use strict";
const rewire = require('rewire'),
  expect = require('chai').expect;

describe('#ApiResponseConverter', function () {

  const ApiResponseConverter = rewire('../../lib/ApiResponseConverter.js');

  describe('convertKrakenTimestampToISOString', function () {

    const convertKrakenTimestampToISOString = ApiResponseConverter.__get__('convertKrakenTimestampToISOString');

    it('converts kraken timestamp properly', function (done) {
      expect(convertKrakenTimestampToISOString(0)).to.equal('1970-01-01T00:00:00.000Z');
      expect(convertKrakenTimestampToISOString(1)).to.equal('1970-01-01T00:00:01.000Z');
      done();
    });

  });

  describe('convertFromKrakenCurrencyCode', function () {

    const convertFromKrakenCurrencyCode = ApiResponseConverter.__get__('convertFromKrakenCurrencyCode');

    it('converts kraken currency code properly', function (done) {
      expect(convertFromKrakenCurrencyCode('ZUSD')).to.equal('USD');
      expect(convertFromKrakenCurrencyCode('ZEUR')).to.equal('EUR');
      expect(convertFromKrakenCurrencyCode('XBT')).to.equal('BTC');
      expect(convertFromKrakenCurrencyCode('XXBT')).to.equal('BTC');
      done();
    });

  });

  describe('convertToKrakenCurrencyCode', function () {

    const convertToKrakenCurrencyCode = ApiResponseConverter.convertToKrakenCurrencyCode;

    it('converts kraken currency code properly', function (done) {
      expect(convertToKrakenCurrencyCode('USD')).to.equal('ZUSD');
      expect(convertToKrakenCurrencyCode('EUR')).to.equal('ZEUR');
      expect(convertToKrakenCurrencyCode('BTC')).to.equal('XXBT');
      done();
    });

  });

  describe('convertFromKrakenTransaction', function () {

    const convertFromKrakenTransaction = ApiResponseConverter.convertFromKrakenTransaction;

    const ledgersApiResponseWithdrawal =
    {
      refid: 'ACLLUS5-JKRHGP-ZWWYSO',
      time: 1480675052.7086,
      type: 'withdrawal',
      aclass: 'currency',
      asset: 'ZUSD',
      amount: '-24952.5900',
      fee: '47.4100',
      balance: '4440.5843'
    };
    const ledgersApiResponseDeposit = {
      refid: 'QGB2OUR-O5OQ6O-T5RZJF',
      time: 1420989927.5751,
      type: 'deposit',
      aclass: 'currency',
      asset: 'XXBT',
      amount: '0.0465757500',
      fee: '0.0000000000',
      balance: '8.3684639100'
    };

    it('converts kraken withdrawal object properly', function (done) {

      const expectedConvertedResponse =
      {
        externalId: 'ACLLUS5-JKRHGP-ZWWYSO',
        timestamp: '2016-12-02T10:37:32.708Z',
        state: 'completed',
        amount: -2495259,
        currency: 'USD',
        type: 'withdrawal',
        raw: ledgersApiResponseWithdrawal
      };

      expect(convertFromKrakenTransaction(ledgersApiResponseWithdrawal)).to.deep.equal(expectedConvertedResponse);
      done();
    });

    it('converts kraken deposit object properly', function (done) {

      const expectedConvertedResponse =
      {
        externalId: 'QGB2OUR-O5OQ6O-T5RZJF',
        timestamp: '2015-01-11T15:25:27.575Z',
        state: 'completed',
        amount: 4657575,
        currency: 'BTC',
        type: 'deposit',
        raw: ledgersApiResponseDeposit
      };

      expect(convertFromKrakenTransaction(ledgersApiResponseDeposit)).to.deep.equal(expectedConvertedResponse);
      done();
    });

  });


});

