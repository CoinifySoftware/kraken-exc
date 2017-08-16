/**
 * Returns the number of decimals after the floating point, with which
 * the amount should be formatted, depending on the currency.
 *
 * @param {string}  currency
 * @returns {int}
 */
function getDecimalsForCurrency(currency) {
  if (currency == 'BTC') {
    return 8;
  } else {
    return 2;
  }
}

/**
 * Convert an amount of money to the smallest sub-unit of the currency.
 * For example, for a BTC account, this function will convert
 * 12345678 to 0.12345678.
 * Likewise, for a USD account, 12345 is converted to 123.45.
 * This function is the inverse of {@self::toSmallestSubUnit}
 *
 * @param {int}     amount
 * @param {string}  currency
 *
 * @return number
 */
function fromSmallestSubUnit(amount, currency) {
  var decimals = getDecimalsForCurrency(currency);
  return round(amount / Math.pow(10, decimals), decimals);
}


/**
 * Convert an amount of smallest sub-unit to the actual currency unit.
 * For example, for a BTC account, this function will convert
 * 0.12345678 to 12345678.
 * Likewise, for a USD account, 123.45 is converted to 12345.
 * This function is the inverse of {@self::fromSmallestSubUnit}
 *
 * @param {number}  amount
 * @param {string}  currency
 *
 * @return int
 */
function toSmallestSubUnit(amount, currency) {
  var decimals = getDecimalsForCurrency(currency);
  return Math.round(amount * Math.pow(10, decimals));
}

/**
 * JavaScript equivalent of the PHP 'round' method.
 *
 * If we want to use the JavaScript native method for rounding - Math.round(), then we need to divide the rounded result
 * in order to get correct main-unit number. Because, eg. 1250000 BTC sub-unit will be rounded to 0,
 * instead of to 0.0125, as this implementation of round() will. Bottom point, we still cannot just use a native method
 * call, without additional operations, in order to achieve the correct rounding that we want.
 * Therefore we use this function.
 *
 * @link found at http://phpjs.org/functions/round/
 *
 * @param {int} value       The number value to be rounded
 * @param {int} precision   The number of positions to be rounded to
 * @returns number
 */
function round(value, precision) {
  var m, f, isHalf, sgn; // helper variables
  precision |= 0; // making sure precision is integer
  m = Math.pow(10, precision);
  value *= m;
  sgn = (value > 0) | -(value < 0); // sign of the number
  isHalf = value % 1 === 0.5 * sgn;
  f = Math.floor(value);

  if (isHalf) {
    value = f + (sgn > 0); // rounds .5 away from zero
  }

  return (isHalf ? value : Math.round(value)) / m;
}

module.exports = {
  fromSmallestSubunit: fromSmallestSubUnit,
  toSmallestSubunit: toSmallestSubUnit,
  round: round
};
