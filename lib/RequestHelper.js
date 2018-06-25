"use strict";
const request = require('request')
  , _ = require('lodash')
  , crypto = require('crypto')
  , async = require('async')
  , Errors = require('./ErrorHelper')
  , constants = require('./constants')
  , querystring = require('querystring');

/**
 * This method returns a signature for a request as a Base64-encoded string
 * @param  {String} path    The relative URL path for the request
 * @param  {Object} params  The POST body
 * @param  {String} secret  The API key secret
 * @return {String} The request signature
 */
function _generateSignature(path, params, secret) {
  const message = querystring.stringify(params)
    , encryptedSecret = new Buffer(secret, 'base64')
    , hash = new crypto.createHash('sha256')
    , hmac = new crypto.createHmac('sha512', encryptedSecret);

  const hash_digest = hash.update(params.nonce + message).digest('binary');

  return hmac.update(path + hash_digest, 'binary').digest('base64');
}

/**
 * Decides whether the request action falls under Kraken's 'public' or 'private' category, and returns the corresponding
 * type.
 *
 * @param {string}  action  The request action.
 * @returns {string} 'public' or 'private'
 * @private
 */
function _decidePublicOrPrivateMethod(action) {
  return _.includes(constants.METHODS.public, action) ? 'public' : 'private';
}

/**
 * Performs the actual request, passed from the _get or _post helper methods.
 *
 * @param {object}      options     An object, containing data that is to be passed along with the request
 * @param {object}      logger      Bunyuan compatible logger
 * @param {function}    callback    Returns the response from the exchange server or an error, if request-response fails
 * @private
 */
function _sendRequest(options, logger, callback) {
  const responseCallback = function (err, res, body) {
    if (err) {
      return callback(Errors.create('An error occurred while performing the request.',
        Errors.EXCHANGE_SERVER_ERROR, err));
    }
    if (!body) {
      return callback(Errors.create('Response body is empty/undefined.',
        Errors.EXCHANGE_SERVER_ERROR, err));
    }

    let data;
    try {
      data = JSON.parse(body)
    } catch (e) {
      return callback(Errors.create('Could not understand response from exchange server.', Errors.MODULE_ERROR, e));
    }

    logger.debug({res: {body}}, "Kraken API response");

    /*
     * The response body always contains an `error` property which is an array. This array will be empty, unless there
     * is an error.
     */
    if (data.error.length !== 0) {
      const cause = new Error(JSON.stringify(data.error));
      const error = Errors.create('The exchange service responded with an error.', Errors.EXCHANGE_SERVER_ERROR, cause);
      error.errorMessages = data.error;
      return callback(error);
    }

    /*
     * Return error if response is empty
     */
    if (_.isEmpty(data.result)) {
      return callback(Errors.create('Response from kraken is empty.', Errors.EXCHANGE_SERVER_ERROR, null));
    }

    return callback(null, data.result);
  };

  const optionsToLog = _.cloneDeep(options);
  optionsToLog.headers = _.omit(optionsToLog.headers, ['API-key', 'API-Sign']);
  logger.debug(optionsToLog, "Kraken API request");

  if (options.method === 'GET') {
    return request.get(options, responseCallback);
  } else if (options.method === 'POST') {
    return request.post(options, responseCallback);
  } else {
    return callback(Errors.create('The request must be either POST or GET.', Errors.MODULE_ERROR, null));
  }
}

/**
 * A helper method to initialize a GET request with its options, and call the request.
 *
 * @param {object}  args    The module object, containing authorisation values
 * @param {string}  action  The API endpoint that is to be requested
 * @param callback
 */
function get(args, action, callback) {
  const method = _decidePublicOrPrivateMethod(action)
    , path = `${constants.API_VERSION}/${method}/${action}`;

  const options = {
    url: args.host + path,
    method: 'GET',
    timeout: args.timeout
  };

  return _sendRequest(options, args.logger, callback);
}

/**
 * A helper method to initialize a POST request with its options and data to be passed, and call the request.
 *
 * @param {object}  args    The module object, containing authorisation values
 * @param {string}  action  The API endpoint that is to be requested
 * @param {object}  params  An object, containing the data to be passed with the POST request
 * @param callback
 */
function post(args, action, params, callback) {
  if (typeof params == 'function') {
    callback = params;
  }

  const method = _decidePublicOrPrivateMethod(action)
    , path = `/${constants.API_VERSION}/${method}/${action}`;

  if (method == 'private' && (!args.key || !args.secret)) {
    return callback('Must provide key and secret to make this API request.');
  }

  const options = {
    url: args.host + path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Kraken Node.js API Client|(github.com/CoinifySoftware/kraken-exc.git)'
    },
    timeout: args.timeout,
    form: params || {}
  };

  /*
   * Add Nonce, OTP, API key and signature for calls to private methods
   */
  if (method == 'private') {
    options.form.nonce = new Date().getTime() * 1000;
    if (args.otp) {
      options.form.otp = args.otp;
    }
    options.headers['API-key'] = args.key;
    options.headers['API-Sign'] = _generateSignature(path, options.form, args.secret);
  }

  return _sendRequest(options, args.logger, callback);
}

module.exports = {
  get: get,
  post: post
};
