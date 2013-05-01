'use strict';

var util = require('util');
var Events = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var globule = require('globule');

module.exports.FilePolling = FilePolling;

function FilePolling(patterns, cb) {

  var self = this;

  process.nextTick(function () {
    self.patterns = {};
    self.addToPatterns(patterns);

    self.statsCache = {};
    self.addStatsToCache(patterns);

    self.timer = setInterval(function () {
      self.compare(Object.keys(self.statsCache));
    }, 100);

    cb.call(self, self);
  });

}

util.inherits(FilePolling, Events);

FilePolling.prototype.addToPatterns = function (patterns) {
  var ret = [];

  if ('string' === typeof patterns) {
    if (!this.patterns[patterns]) {
      this.patterns[patterns] = patterns;
      ret.push(patterns);
    }

  } else {
    patterns.forEach(function (p) {
      if (!this.patterns[patterns]) {
        this.patterns[p] = p;
        ret.push(p);
      }
    }, this);
  }
  return ret;
};

FilePolling.prototype.removeFromPatterns = function (patterns) {
  var ret = [];
  if ('string' === typeof patterns) {
    if (this.patterns[patterns]) {
      delete this.patterns[patterns];
      ret.push(patterns);
    }

  } else {
    patterns.forEach(function (p) {
      if (this.patterns[patterns]) {
        delete this.patterns[p];
        ret.push(p);
      }
    }, this);
  }
  return ret;
};

FilePolling.prototype.addStatsToCache = function (patterns) {

  var files = globule.find(patterns);

  files.forEach(function (file) {
    var stats = fs.statSync(file);
    this.statsCache[file] = stats;
  }, this);

};

FilePolling.prototype.removeStatsFromCache = function (patterns) {

  var files = globule.find(patterns);

  files.forEach(function (file) {
    if (this.statsCache[file]) {
      delete this.statsCache[file];
    }
  }, this);

};

FilePolling.prototype.checkAddOrUpdate = function (pattern) {

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

FilePolling.prototype.close = function () {
  clearInterval(this.timer);
};

FilePolling.prototype.add = function (patterns, cb) {
  var self = this;

  process.nextTick(function () {
    var initPatterns = self.addToPatterns(patterns);
    self.addStatsToCache(initPatterns);
    cb.call(self, self);
  });

};

FilePolling.prototype.remove = function (patterns, cb) {

  var self = this;

  process.nextTick(function () {
    var removedPatterns = self.removeFromPatterns(patterns);
    self.removeStatsFromCache(removedPatterns);
    cb.call(self, self);
  });

};

FilePolling.prototype.watched = function () {

  return Object.keys(this.statsCache);

};

FilePolling.prototype.checkDeleted = function (checkedFiles) {

  Object.keys(this.statsCache).forEach(function (curPath) {

    if (!checkedFiles[curPath]) {
      this.emit('deleted', curPath);
      delete this.statsCache[curPath];
    }

  }, this);

};

FilePolling.prototype.compare = function (pattern) {
  var checkedFiles = this.checkAddOrUpdate(pattern);
  this.checkDeleted(checkedFiles);
};

