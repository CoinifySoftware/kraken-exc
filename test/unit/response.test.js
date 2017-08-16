"use strict";
const sinon = require('sinon'),
  request = require('request'),
  expect = require('chai').expect,
  Kraken = require('../../index.js'),
  Error = require('../../lib/ErrorHelper.js');

describe('response handler function', () => {
  const kraken = new Kraken({
    key: "apikey",
    secret: "apisecret",
    otp: '2FA'
  });

  let reqStub
    , response;

  beforeEach((done) => {
    response = {
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

  it('should return an error that has occurred while performing the request', function (done) {
    const errorCause = 'ASD';
    reqStub.yields(errorCause, {}, JSON.stringify(response));

    kraken.getBalance(function (err, result) {
      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {otp: '2FA'}});

      expect(result).to.equal(undefined);
      expect(err.message).to.equal('An error occurred while performing the request.');
      expect(err.code).to.equal(Error.EXCHANGE_SERVER_ERROR);
      expect(err.cause).to.equal(errorCause);

      done();
    });
  });

  it('should return an error because of empty response body', function (done) {
    reqStub.yields(null, {}, null);

    kraken.getBalance(function (err, result) {
      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {otp: '2FA'}});

      expect(result).to.equal(undefined);
      expect(err.message).to.equal('Response body is empty/undefined.');
      expect(err.code).to.equal(Error.EXCHANGE_SERVER_ERROR);

      done();
    });
  });

  it('should return an error that was returned from the exchange service', function (done) {
    const exchangeErrorMsg = ['Some random test error'];
    reqStub.yields(null, {}, JSON.stringify({error: exchangeErrorMsg}));

    kraken.getBalance(function (err, result) {
      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {otp: '2FA'}});

      expect(result).to.equal(undefined);
      expect(err.message).to.equal('The exchange service responded with an error.');
      expect(err.errorMessages).to.deep.equal(exchangeErrorMsg);
      expect(err.cause).to.be.an('Error');
      expect(err.cause.message).to.deep.equal(JSON.stringify(exchangeErrorMsg));

      done();
    });
  });

  it('should return an error because the response body result could not be parsed', function (done) {
    reqStub.yields(null, {}, {result: {asd: 'some result, does not matter...'}});

    kraken.getBalance(function (err, result) {
      expect(reqStub.calledOnce).to.equal(true);
      // Check input args
      expect(reqStub.firstCall.args[0]).to.containSubset({form: {otp: '2FA'}});

      expect(result).to.equal(undefined);
      expect(err.message).to.equal('Could not understand response from exchange server.');
      expect(err.code).to.equal(Error.MODULE_ERROR);

      done();
    });
  });

});
