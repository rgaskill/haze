'use strict';

var util = require('util');
var Events = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var globule = require('globule');

var PatternCollection = require('./common/patternCollection').PatternCollection;

module.exports.FilePolling = FilePolling;

function FilePolling(patterns, cb) {

  var self = this;

  process.nextTick(function () {

    self.patterns = new PatternCollection();
    self.statsCache = {};

    if (patterns) {
      self.patterns.addToPatterns(patterns);
      self.addStatsToCache(patterns);
    }

    self.timer = setInterval(function () {
      self.compare(Object.keys(self.patterns.patterns));
    }, 100);

    if (cb) {
      cb.call(self, self);
    }

  });

}

util.inherits(FilePolling, Events);


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

    var self = this;

    var stats = fs.statSync(file);
    var cachedStats = this.statsCache[file];

    if (stats.isDirectory()) {
      return;
    }

    if (!cachedStats) {
      this.statsCache[file] = stats;
      process.nextTick(function () {
        self.emit('added', file);
      });

    } else if (stats.mtime.getTime() !== cachedStats.mtime.getTime()) {
      this.statsCache[file] = stats;
      process.nextTick(function () {
        self.emit('changed', file);
      });
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
    var initPatterns = self.patterns.addToPatterns(patterns);
    self.addStatsToCache(initPatterns);

    cb.call(self, self);
  });

  return this;

};

FilePolling.prototype.remove = function (patterns, cb) {

  var self = this;

  process.nextTick(function () {
    var removedPatterns = self.patterns.removeFromPatterns(patterns);
    self.removeStatsFromCache(removedPatterns);
    cb.call(self, self);
  });

  return this;

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

