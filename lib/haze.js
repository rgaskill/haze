'use strict';

var util = require('util');
var Events = require('events').EventEmitter;

var FilePolling = require('./backends/filePolling').FilePolling;
var FileWatching = require('./backends/fileWatching').FileWatching;

module.exports = function haze(patterns, done, backend) {
  return new Haze(patterns, done, backend);
};

module.exports.Haze = Haze;

function Haze(pattern, cb, backend) {
  var self = this;

  if (backend) {
    this.backend = backend;
  } else {
    this.backend = new FilePolling(pattern, cb);
  }

  this.backend.on('added', function (file) {
    self.emit('added', file);
  });

  this.backend.on('changed', function (file) {
    self.emit('changed', file);
  });

  this.backend.on('deleted', function (file) {
    self.emit('deleted', file);
  });
}

util.inherits(Haze, Events);

Haze.prototype.close = function () {
  this.backend.close();
};

Haze.prototype.add = function (patterns, cb) {
  this.backend.add(patterns, cb);
};

Haze.prototype.remove = function (patterns, cb) {
  this.backend.remove(patterns, cb);
};

Haze.prototype.watched = function () {
  return this.backend.watch();
};



