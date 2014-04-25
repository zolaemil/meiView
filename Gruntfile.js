module.exports = function(grunt) {

  'use strict';

  // Load plugins. 
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        options: {
          mangle: true,
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'   
        },   
        files: { 
          'dist/<%= pkg.name %>.min.js': [ 'dist/<%= pkg.name %>-all.js' ],
        }
      }
    },

    cssmin: {
      combine: {
        files: {
          'dist/<%= pkg.name %>.min.css': ['dist/<%= pkg.name %>-all.css' ]
        }
      }
    },
    
    concat: {
      bower_js: {
        options: {
          separator: ';'
        },
        src: [
          'js/compactviewer-ui.js,',
          'js/compactviewer.js',
          'js/meiview-filter.js',
          'js/meiview-ui.js',
          'js/meiview.js',
        ],
        dest: 'dist/meiview-all.js'
      },
      bower_css: {
        options: {
          separator: ';'
        },
        src: [
          'css/meiview.css,',
          'css/compactviewer.css',
        ],
        dest: 'dist/meiview-all.css'
      },
      
    },

    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },

    watch: {
      scripts: {
        files: ['js/*.js', 'css/*.css' ],
        tasks: ['concat', 'cssmin', 'uglify'], 
        options: {
          livereload: true
        }
      }
    },

  });


  // Tasks.
  grunt.registerTask('default', ['concat', 'cssmin', 'uglify']);
  grunt.registerTask('run', ['connect', 'watch']);
}