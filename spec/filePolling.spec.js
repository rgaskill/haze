'use strict';

describe('Test file polling backend.', function () {

  var FilePolling = require('../lib/backends/filePolling').FilePolling;
  var fs = require('fs');
  var path = require('path');
  var rimraf = require('rimraf').sync;

  var rootDir = 'root_test_watched';
  var poller;

  var clearWatchedDir = function () {
    if (fs.existsSync(rootDir)) {
      rimraf(rootDir);
    }
  };

  var createFile = function (file) {
    var ret = path.join(rootDir, file);

    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir);
    }

    fs.openSync(ret, 'w');
    return ret;
  };

  var join = path.join;

  beforeEach(function () {
    clearWatchedDir();
    poller = new FilePolling();
  });

  afterEach(function () {
    poller.close();
    clearWatchedDir();
  });

  it('should be able to be constructed with a pattern', function () {

    var done = false;
    var test2File;

    createFile('test.js');

    new FilePolling(join(rootDir, '**/*.js'), function(p) {

      p.on('added', function (file) {
        expect(file).toEqual(test2File);
        done = true;
        p.close();
      });

      test2File = createFile('test2.js');
    });

    waitsFor(function () {
      return done;
    }, 500);

  });

  it('should be able to add a pattern after construction', function () {

    var done = false;
    var test2File;

    poller.on('added', function (file) {
      expect(file).toEqual(test2File);
      done = true;
    });

    createFile('test.js');

    poller.add(join(rootDir, '**/*.js'), function (p) {
      test2File = createFile('test2.js');
    });

    waitsFor(function () {
      return done;
    }, 500);

  });

});