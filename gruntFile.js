module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-benchmark');

  grunt.initConfig({

   benchmark: {
     all: {
       src: ['benchmarks/*.js'],
       options: { times: 10 }
     }
   }

  });

};