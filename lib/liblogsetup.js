"use strict";

const LOGGER = require('winston');
const moment = require('moment');

/**
 * @external winston
 * @see      {@link https://www.npmjs.com/package/winston|winston}
 */

/**
 * @external moment
 * @see      {@link https://www.npmjs.com/package/moment|moment}
 */

/**
 * @module liblogsetup
 *
 * @requires {@link external:winston|winston}
 * @requires {@link external:moment|moment}
 *
 * @copyright Genome Research Limited 2022
 */

var getTimeStamp = function() {
  return moment().format('YYYY-MM-DD HH:mm:ss Z');
};

try {
  LOGGER.add(new LOGGER.transports.Console( {
    colorize:  true,
    json:      false,
    timestamp: getTimeStamp,
    stderrLevels: [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ] // Which levels to send to stderr (all)
  }));
} catch (e) {
  console.error('Error when trying to init logging with Winston');
  console.error(e);
  process.exit(1);
}

module.exports = LOGGER;
