'use strict';

var fs = require('fs');
var path = require('path');
var fileset = require('fileset');

var statsCache = {};



var findNew = function(pattern, init){

  fileset(pattern, function(err, files) {
    if (err) {
      return console.error(err);
    }

    files.forEach(function(file) {

      fs.stat(file, function(error, stats) {

        if (stats.isDirectory()){
          return;
        }

        var cachedStats = statsCache[file];

        if (!cachedStats) {
          if ( !init ){
            console.log(file, 'adding');
          }
          statsCache[file] = stats;
        }
      });

    });

  });

};

var checkUpdate = function() {

  Object.keys(statsCache).forEach(function(curPath) {

    if (fs.existsSync(curPath)){
      fs.stat(curPath, function(error, stats) {
        var cachedStats = statsCache[curPath];

        if (cachedStats) {
          if (stats.mtime.getTime() !== cachedStats.mtime.getTime()){
            console.log(curPath, 'changed');
            statsCache[curPath] = stats;
          }
        } else {
          console.log('something is wrong');
        }

        if (stats.isDirectory()){
          findNew(curPath);
        }

      });
    } else {
      console.log('file deleted', curPath);
      delete statsCache[curPath];
    }

  });

};

var compare = function(pattern) {
  findNew(pattern);
  checkUpdate();
};

findNew('**/*.js',true);
setInterval(function() {
  compare('**/*.js');
}, 500);










