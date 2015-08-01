var loggly = require('loggly'),
  util = require('util');

// Parts of the code borrowed from https://github.com/thlorenz/bunyan-format/blob/master/lib/format-record.js

// Levels
var TRACE = 10;
var DEBUG = 20;
var INFO = 30;
var WARN = 40;
var ERROR = 50;
var FATAL = 60;

/**
 * @param {int} level is the level of the record.
 * @return The level value to its String representation.
 * This is only used on json-related formats output and first suggested at
 * https://github.com/trentm/node-bunyan/issues/194#issuecomment-64858117
 */
function mapLevelToName(level) {
  switch (level) {
    case TRACE:
      return 'TRACE';
    case DEBUG:
      return 'DEBUG';
    case INFO:
      return 'INFO';
    case WARN:
      return 'WARN';
    case ERROR:
      return 'ERROR';
    case FATAL:
      return 'FATAL';
  }
}

function Bunyan2Loggly(logglyConfig, buffer) {

  this.logglyConfig = logglyConfig || {};

  // define the log as being json (because bunyan is a json logger)
  this.logglyConfig.json = true;

  // define the buffer count, unless one has already been defined
  this.buffer = buffer || 1;
  this._buffer = [];

  // add the https tag by default, just to make the loggly source setup work as expect
  this.logglyConfig.tags = this.logglyConfig.tags || [];
  this.logglyConfig.tags.push('https');

  // create the client
  this.client = loggly.createClient(logglyConfig);

}

Bunyan2Loggly.prototype.write = function (rec) {

  if (typeof rec !== 'object' && !Array.isArray(rec)) {
    throw new Error('bunyan-loggly requires a raw stream. Please define the type as raw when setting up the bunyan stream.');
  }

  if (typeof rec === 'object') {

    // loggly prefers timestamp over time
    if (rec.time !== undefined) {
      rec.timestamp = rec.time;
      delete rec.time;
    }

		if (rec.level !== undefined) {
			rec.level = mapLevelToName(rec.level);
		}

  }

  // write to our array buffer
  this._buffer.push(rec);

  // check the buffer, we may or may not need to send to loggly
  this.checkBuffer();

};

Bunyan2Loggly.prototype.checkBuffer = function () {

  if (this._buffer.length < this.buffer) {
    return;
  }

  // duplicate the array, because it could be modified before our HTTP call succeeds
  var content = this._buffer.slice();
  this._buffer = [];

  // log multiple (or single) requests with loggly
  this.client.log(content);

};

module.exports.Bunyan2Loggly = Bunyan2Loggly;
