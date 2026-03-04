const gulp = require('gulp');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const through2 = require('through2');
const stylus = require('stylus');
const path = require('path');

module.exports = (config) => {
  return () => {
    return gulp.src(config.input)
      .pipe(plumber())
      .pipe(through2.obj((file, _enc, callback) => {
        if (file.isNull()) {
          return callback(null, file);
        }
        if (file.isStream()) {
          return callback(new Error('Streaming not supported for stylus compilation.'));
        }

        stylus(file.contents.toString(), {
          filename: file.path,
          paths: config.include || [],
        }).render((err, css) => {
          if (err) {
            return callback(err);
          }
          file.contents = Buffer.from(css);
          file.path = file.path.replace(path.extname(file.path), '.css');
          callback(null, file);
        });
      }))
      .pipe(concat(config.name))
      .pipe(gulp.dest(config.output));
  };
};
