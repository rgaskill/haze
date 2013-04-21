'use strict';

var fs = require('fs');
var path = require('path');
var globule = require('globule');

var statsCache = {};

//manually travers directory
var travers = function (dir) {

  fs.readdir(dir, function (err, list) {

    list.forEach(function (file) {
      file = path.join(dir, file);

      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          travers(file);
        } else {
          console.log('adding', file);
        }
      });
    });
  });
};

var findNew = function (pattern, init) {

  var files = globule.find(pattern);

  files.forEach(function (file) {

    var stats = fs.statSync(file);

    if (stats.isDirectory()) {
      return;
    }

    var cachedStats = statsCache[file];

    if (!cachedStats) {
      if (!init) {
        console.log(file, 'adding');
      } else {
        console.log(file, 'initing');
      }
      statsCache[file] = stats;
    }

  });

};

var checkUpdate = function () {

  Object.keys(statsCache).forEach(function (curPath) {

    if (fs.existsSync(curPath)) {
      fs.stat(curPath, function (error, stats) {
        var cachedStats = statsCache[curPath];

        if (cachedStats) {
          if (stats.mtime.getTime() !== cachedStats.mtime.getTime()) {
            console.log(curPath, 'changed');
            statsCache[curPath] = stats;
          }
        } else {
          console.log('something is wrong');
        }

        if (stats.isDirectory()) {
          findNew(curPath);
        }

      });
    } else {
      console.log('file deleted', curPath);
      delete statsCache[curPath];
    }

  });

};

var compare = function (pattern) {
  findNew(pattern, false);
  checkUpdate();
};

findNew('**/*.js', true);
console.log('inited');
setInterval(function () {
  compare('**/*.js');
}, 500);