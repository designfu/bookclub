const ENV = process.env.ENV || 'local';

const gulp = require('gulp');
const ga = require('./utils/ga');
const Config = require('./config')(ENV);
const recipe = (name, config) => require('./recipes/' + name)(config);
const { series, parallel } = gulp;

console.log('Building with config: ', Config);

gulp.task('env', recipe('env', {
  NODE_PATH: 'source/js:node_modules'
}));

gulp.task('clean', recipe('clean', {
  input: './dist'
}));

gulp.task('css', recipe('copy', {
  input: './source/css/main.css',
  output: './dist/css',
}));

gulp.task('js:node_modules', recipe('copy', {
  input: [
    './node_modules/lodash/lodash.js',
    './node_modules/jquery/dist/jquery.js',
    './node_modules/lockr/lockr.js',
  ],
  output: './dist/vendor'
}));

gulp.task('static', recipe('copy', {
  input: './static/**/*',
  output: './dist'
}));

gulp.task('inject', recipe('html', {
  cwd: './dist',
  input: './source/html/**/*.html',
  sources: [[
    'vendor/jquery.js',
    'vendor/lockr.js',
    'vendor/lodash.js',
  ], [
    'css/main.css',
    'js/bundle.js',
  ]],
  output: './dist',
  replacements: [
    ['@{SENTRY}', Config.SENTRY],
    ['@{GA}', ga(Config.GA)],
    ['@{VERSION}', Config.VERSION],
    ['@{ENV}', Config.ENV],
  ],
}));

gulp.task('watch', () => {
  gulp.watch([
    './source/html/**/*.html',
    './dist/**/*.js',
    './dist/**/*.css',
    './dist/vendor/**/*',
  ], series('inject'));
  gulp.watch('./source/css/**/*.css', series('css', 'inject'));
  gulp.watch('./static/**/*', series('static'));
});

gulp.task('compile', series(
  'env',
  parallel('js:node_modules', 'static', 'css'),
  'inject'
));

gulp.task('default', series('compile', 'watch'));
