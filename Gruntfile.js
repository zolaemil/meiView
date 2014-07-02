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
          'dist/<%= pkg.name %>.min.js': [ 'dist/<%= pkg.name %>.js' ],
        }
      }
    },

    cssmin: {
      files: {
        'dist/<%= pkg.name %>.min.css': ['dist/<%= pkg.name %>.css' ]
      }
    },
    
    concat: {
      bower_js: {
        options: {
          separator: ';'
        },
        src: [
          'js/meiview.js',
          'js/meiview-ui.js',
          'js/meiview-filter.js',
          'js/compactviewer.js',
          'js/compactviewer-ui.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      },
      bower_css: {
        options: {
          separator: '\n',
        },
        src: [
          'css/meiview.css',
          'css/compactviewer.css',
        ],
        dest: 'dist/<%= pkg.name %>.css'
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
  grunt.registerTask('build', ['concat', 'cssmin', 'uglify']);
  grunt.registerTask('run', ['connect', 'watch']);
  grunt.registerTask('default', ['build', 'run']);
}