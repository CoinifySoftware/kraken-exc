const EXCHANGE_SERVER_ERROR = 'exchange_server_error';
const MODULE_ERROR = 'internal_module_error';

/**
 * Constructs and returns an Error node.js native object, attaches a message and a pre-declared error code to it,
 * and the original error data, if provided.
 * @param {string}        message     Human readable error message
 * @param {string}        errorCode   Machine readable error message code
 * @param {object|string} errorCause  The raw/original error data (message or an object of messages) that the system
 *                                    responded with and provides detailed information about the cause of the error
 * @returns {Error}
 */
function constructError(message, errorCode, errorCause) {
  var error = new Error(message);
  error.code = errorCode;
  if (errorCause) {
    error.cause = errorCause;
  }

  return error;
}

module.exports = {
  create: constructError,

  EXCHANGE_SERVER_ERROR: EXCHANGE_SERVER_ERROR,
  MODULE_ERROR: MODULE_ERROR
};
