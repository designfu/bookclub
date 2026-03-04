const path = require('path');
const webpack = require('webpack');
if(!process.env.ENV) {
  throw new Error('ENV not set.');
}
const watch = process.env.WATCH !== 'false';
const mode = process.env.ENV === 'production' ? 'production' : 'development';

module.exports = {
  entry: "./source/js/index.tsx",
  mode,
  output: {
    filename: "bundle.js",
    path: __dirname + "/dist/js"
  },
  watch,

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    modules: [
      path.resolve('../shared'),
      path.resolve('source/js'),
      'node_modules'
    ],
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx",  ".js", ".json"],
    alias: {
      "@shared": path.resolve(__dirname, "../shared/@shared/"),
      "@env": path.resolve(__dirname, "../shared/@env/"),
      "@client": path.resolve(__dirname, "source/js"),
    },
    // plugins: [
    //     new TsConfigPathsPlugin(/* { tsconfig, compiler } */)
    // ]
  },

  module: {
    rules: [
      // Compile TypeScript with type-checking.
      { test: /\.tsx?$/, loader: "ts-loader" },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
    ],
  },

  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /@env\/@\{ENV\}-client$/,
      `@env/${process.env.ENV.toLowerCase()}-client`
    ),
  ],

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
    "lodash": "_",
    "jquery": "$"
  },
};
