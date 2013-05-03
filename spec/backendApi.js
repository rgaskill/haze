'use strict';

var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf').sync;

var rootDir;
var join = path.join;

var createFile = function (file) {
  var ret = path.join(rootDir, file);

  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir);
  }

  fs.openSync(ret, 'w');
  return ret;
};

module.exports = {
  testConstructor: function (Backend) {
    return function () {
      var done = false;
      var test2File;

      createFile('test.js');

      new Backend(join(rootDir, '**/*.js'), function (p) {

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
    }
  },

  testAdd: function (Backend) {
    var poller = new Backend();
    return function () {

      var done = false;
      var test2File;

      poller.on('added', function (file) {
        expect(file).toEqual(test2File);
        done = true;
        poller.close();
      });

      createFile('test.js');

      poller.add(join(rootDir, '**/*.js'), function (p) {
        test2File = createFile('test2.js');
      });

      waitsFor(function () {
        return done;
      }, 500);

    };
  },
  testWatch: function (Backend) {
    var poller = new Backend();
    return function () {

      var done = false;
      var testFile;
      var test2File;

      testFile = createFile('test.js');

      poller.on('added', function (file) {
        var watched = poller.watched();
        expect(watched.length).toEqual(2);
        expect(watched).toContain(test2File);
        expect(watched).toContain(testFile);
        done = true;
        poller.close();
      });

      poller.add(join(rootDir, '**/*.js'), function (p) {

        var watched = p.watched();
        expect(watched.length).toEqual(1);
        expect(watched).toContain(testFile);

        test2File = createFile('test2.js');
      });

      waitsFor(function () {
        return done;
      }, 500);

    };
  },
  testRemove: function (Backend) {
    return function () {

      var done = false;
      var pattern = join(rootDir, '**/*.js');
      var testFile = createFile('test.js');

      var fp = new Backend(pattern, function () {
        var watched = fp.watched();
        expect(watched.length).toEqual(1);
        expect(watched).toContain(testFile);

        fp.remove(pattern, function () {
          var watched = fp.watched();
          expect(watched.length).toEqual(0);
          done = true;
          fp.close();
        });

      });

      waitsFor(function () {
        return done;
      }, 500);

    };
  },
  rootDir: function (dir) {
    rootDir = dir;
  }
};



