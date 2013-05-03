'use strict';

describe('Test file polling backend.', function () {

  var fs = require('fs');
  var path = require('path');
  var rimraf = require('rimraf').sync;

  var FilePolling = require('../lib/backends/filePolling').FilePolling;
  var backendApi = require('./backendApi');

  var rootDir = 'root_test_watched';

  var clearWatchedDir = function () {
    if (fs.existsSync(rootDir)) {
      rimraf(rootDir);
    }
  };

  beforeEach(function () {
    backendApi.rootDir(rootDir);
    clearWatchedDir();
  });

  afterEach(function () {
    clearWatchedDir();
  });

  it('should be able to be constructed with a pattern', backendApi.testConstructor(FilePolling));

  it('should be able to add a pattern after construction', backendApi.testAdd(FilePolling));

  it('should return watched files', backendApi.testWatch(FilePolling));

  it('should be able to remove a pattern', backendApi.testRemove(FilePolling));

});