'use strict';

var util = require('util');
var Events = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var globule = require('globule');

var PatternCollection = require('./common/patternCollection').PatternCollection;

module.exports.FileWatching = FileWatching;

function FileWatching(pattern, cb) {

  var self = this;

  process.nextTick(function () {

    self.patterns = new PatternCollection();
    self.patterns.addToPatterns(pattern);

    self.statsCache = {};

    self.addStatsToCache(pattern);

    self.timer = setInterval(function () {
      self.compare(pattern);
    }, 100);

    cb.call(self, self);

  });


}

util.inherits(FileWatching, Events);

FileWatching.prototype.add = function (patterns, cb) {
  var self = this;

  process.nextTick(function () {
    var initPatterns = self.patterns.addToPatterns(patterns);
    self.addStatsToCache(initPatterns);
    cb.call(self, self);
  });

};

FileWatching.prototype.remove = function (patterns, cb) {

  var self = this;

  process.nextTick(function () {
    var removedPatterns = self.patterns.removeFromPatterns(patterns);
    self.removeStatsFromCache(removedPatterns);
    cb.call(self, self);
  });

};

FileWatching.prototype.watched = function () {

  return Object.keys(this.statsCache);

};


FileWatching.prototype.addStatsToCache = function (pattern) {

  var self = this;
  var files = globule.find(pattern);

  files.forEach(function (file) {

    var stats = fs.statSync(file);

    if (stats.isDirectory()) {
      return;
    }
    //ulimit -n 10000
    self.statsCache[file] = self.createWatch(file);

  });

};

FileWatching.prototype.removeStatsFromCache = function (patterns) {

  var files = globule.find(patterns);

  files.forEach(function (file) {
    if (this.statsCache[file]) {
      this.statsCache[file].close();
      delete this.statsCache[file];
    }
  }, this);

};

FileWatching.prototype.checkAddOrUpdate = function (pattern) {

  var self = this;
  var files = globule.find(pattern);
  var ret = {};

  files.forEach(function (file) {

    var stats = fs.statSync(file);
    var cachedStats = self.statsCache[file];

    if (stats.isDirectory()) {
      return;
    }

    if (!cachedStats) {
      console.log(file, 'adding');
      self.emit('added', file);
      self.statsCache[file] = self.createWatch(file);

    }

    ret[file] = stats;

  });

  return ret;

};

FileWatching.prototype.createWatch = function (file) {

  var self = this;

  return fs.watch(file, function (event, changedFile) {
    console.log(file, 'changed');
    console.log(event, 'changed event');
    self.emit('changed', file);
  });

};

FileWatching.prototype.close = function () {

  var self = this;

  Object.keys(self.statsCache).forEach(function (curPath) {
    self.statsCache[curPath].close();
  });

};

FileWatching.prototype.checkDeleted = function (checkedFiles) {

  var self = this;

  clearInterval(this.timer);

  Object.keys(self.statsCache).forEach(function (curPath) {

    if (!checkedFiles[curPath]) {
      self.emit('deleted', curPath);
      delete self.statsCache[curPath];
    }

  });

};

FileWatching.prototype.compare = function (pattern) {
  var checkedFiles = this.checkAddOrUpdate(pattern);
  this.checkDeleted(checkedFiles);
};
