'use strict';

var haze = require('../lib/haze');
var grunt = require('grunt');
var path = require('path');

// Folder to watch
var watchDir = path.resolve(__dirname, 'watch');

// Helper for creating mock files
function createFiles(num, dir) {
  for (var i = 0; i < num; i++) {
    grunt.file.write(path.join(dir, 'test-' + i + '.js'), 'var test = ' + i + ';');
  }
}

module.exports = {
  'setUp': function(done) {
    // ensure that your `ulimit -n` is higher than amount of files
    if (grunt.file.exists(watchDir)) {
      grunt.file.delete(watchDir, {force:true});
    }
    createFiles(100, path.join(watchDir, 'one'));
    createFiles(100, path.join(watchDir, 'two'));
    createFiles(100, path.join(watchDir, 'three'));
    createFiles(100, path.join(watchDir, 'three', 'four'));
    createFiles(100, path.join(watchDir, 'three', 'four', 'five', 'six'));
    process.chdir(watchDir);
    done();
  },
  'tearDown': function(done) {
    if (grunt.file.exists(watchDir)) {
      grunt.file.delete(watchDir, {force:true});
    }
    done();
  },
  changed: function(done) {
    haze('**/*', function( watcher) {
      this.on('changed', function() {
        watcher.close();
        done();
      });
      setTimeout(function() {
        var rand = String(new Date().getTime()).replace(/[^\w]+/g, '');
        grunt.file.write(path.join(watchDir, 'one', 'test-99.js'), 'var test = "' + rand + '"');
      }, 1000);
    });
  }
};