'use strict';

var util = require('util');
var Events = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var globule = require('globule');

module.exports = function haze(patterns, opts, done) {
  return new Haze(patterns, opts, done);
};
module.exports.Haze = Haze;

util.inherits(Haze, Events);

function Haze(pattern, cb) {

  var self = this;

  this.statsCache = {};
  this.initCache(pattern);
  this.timer = setInterval(function () {
    self.compare(pattern);
  }, 100);

  cb.call(self, self);

}

Haze.prototype.initCache = function (pattern) {

  var files = globule.find(pattern);

  files.forEach(function (file) {
    var stats = fs.statSync(file);
    this.statsCache[file] = stats;
  }, this);

};

Haze.prototype.checkAddOrUpdate = function (pattern) {

  var files = globule.find(pattern);
  var ret = {};

  files.forEach(function (file) {

    var stats = fs.statSync(file);
    var cachedStats = this.statsCache[file];

    if (stats.isDirectory()) {
      return;
    }

    if (!cachedStats) {
      console.log(file, 'adding');
      this.emit('added', file);
      this.statsCache[file] = stats;
    } else if (stats.mtime.getTime() !== cachedStats.mtime.getTime()) {
      console.log(file, 'changed');
      this.emit('changed', file);
      this.statsCache[file] = stats;
    }

    ret[file] = stats;

  }, this);

  return ret;

};

Haze.prototype.close = function () {
  clearInterval(this.timer);
};

Haze.prototype.checkDeleted = function (checkedFiles) {

  Object.keys(this.statsCache).forEach(function (curPath) {

    if (!checkedFiles[curPath]) {
      this.emit('deleted', curPath);
      delete this.statsCache[curPath];
    }

  }, this);

};

Haze.prototype.compare = function (pattern) {
  var checkedFiles = this.checkAddOrUpdate(pattern);
  this.checkDeleted(checkedFiles);
};

