const ENV = process.env.ENV || 'production';

const gulp = require('gulp');
const ga = require('./utils/ga');
const Config = require('./config')(ENV);
const recipe = (name, config) => require('./recipes/' + name)(config);
const { series, parallel } = gulp;

gulp.task('env', recipe('env', {
  NODE_PATH: 'source/js::../shared:node_modules'
}));

gulp.task('clean', recipe('clean', {
  input: './dist'
}));

const cssTasks = Config.CSS_BUNDLES.map(title => {
  const taskName = `css:${title}`;
  gulp.task(taskName, recipe('stylus', {
    input: `./source/css/${title}.bundle.styl`,
    output: './dist/css',
    name: `${title}.css`
  }));
  return taskName;
});
gulp.task('css', parallel(...cssTasks));

gulp.task('js:node_modules', recipe('copy', {
  input: [
    './node_modules/lodash/lodash.js',
    './node_modules/jquery/dist/jquery.js',
    './node_modules/lockr/lockr.js',
  ],
  output: './dist/vendor',
}));

gulp.task('static:node_modules', recipe('copy', {
  input: [
    './node_modules/react/umd/react.development.js',
    './node_modules/react-dom/umd/react-dom.development.js',
  ],
  output: './dist/vendor'
}));

const jsClientTasks = Config.JS_BUNDLES.map(title => {
  const taskName = `js:source:${title}`;
  gulp.task(taskName, recipe('tsify-sourcemaps', {
    input: `./source/js/${title}.bundle.${Config.EXT.JS}`,
    external: Config.NODE_MODULES,
    output: './dist/js',
    name: `${title}.js`,
    baseUrl: './source/js',
    ignoreErrors: [
      /Error TS2686: '_' refers to a UMD global, but the current file is a module. Consider adding an import instead./
    ]
  }));
  return taskName;
});
gulp.task('js:client', parallel(...jsClientTasks));

gulp.task('inject', recipe('html', {
  cwd: './dist',
  input: './source/html/**/*.html',
  sources: [[
    'vendor/jquery.js',
    'vendor/lockr.js',
    'vendor/lodash.js',
    'vendor/react.development.js',
    'vendor/react-dom.development.js',
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

gulp.task('static', recipe('copy', {
  input: './static/**/*',
  output: './dist'
}));

gulp.task('watch', () => {
  gulp.watch([
    './source/html/**/*.html',
    './dist/**/*.js',
    './dist/**/*.css',
    './dist/vendor/**/*',
  ], series('inject'));
  gulp.watch('./source/css/**/*.styl', series('css', 'inject'));
  gulp.watch('./static/**/*', series('static'));
});

gulp.task('compile', series(
  'env',
  parallel('js:node_modules', 'static:node_modules', 'static', 'css'),
  'inject'
));

gulp.task('default', series('compile'));
