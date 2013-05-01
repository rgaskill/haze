'use strict';

module.exports.PatternCollection = PatternCollection;

function PatternCollection() {
  this.patterns = {};
}

PatternCollection.prototype.addToPatterns = function (patterns) {
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

PatternCollection.prototype.removeFromPatterns = function (patterns) {
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