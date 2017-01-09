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
 * @module logsetup
 *
 * @requires {@link external:winston|winston}
 * @requires {@link external:moment|moment}
 *
 * @author Jaime Tovar
 * @copyright Genome Research Limited 2016
 */

var getTimeStamp = function() {
  return moment().format('YYYY-MM-DD HH:mm:ss Z');
};

var setup = function(logconsole) {
  try {
    LOGGER.remove(LOGGER.transports.Console);
    if (logconsole) {
      LOGGER.add(LOGGER.transports.Console, {
        level:        'warn',
        colorize:     true,
        json:         false,
        timestamp:    getTimeStamp,
        stderrLevels: [ 'error', 'warn', 'info', 'verbose', 'debug', 'silly' ] // Which levels to send to stderr
      });
    }
  } catch (e) {
    console.error('Error when trying to init logging with Winston');
    console.error(e);
    process.exit(1);
  }
};

module.exports = LOGGER;
module.exports.setup = setup;
