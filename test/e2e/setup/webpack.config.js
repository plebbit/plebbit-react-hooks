// use these webpack config to create an in memory dev server to
// use for testing in browser

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

// dev mode creates the files in memory
const rootPath = path.resolve(__dirname, '..', '..', '..')
const buildPath = path.resolve(rootPath, 'build')
const entryPath = path.resolve(__dirname, '..', 'react-app', 'index.tsx')

module.exports = {
  entry: entryPath,

  // dev mode creates the files in memory
  mode: 'development',

  // add stack trace for errors
  devtool: 'inline-source-map',

  module: {
    rules: [{
      // transpile typescript
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },

  plugins: [
    // create some html file, not just the .js bundle
    new HtmlWebpackPlugin(),

    // fix process polyfill
    new webpack.ProvidePlugin({process: 'process/browser'})
  ],

  // options of the .js bundle
  output: {
    filename: 'bundle.js',
    // path is in memory for dev mode
    path: buildPath,
    // delete files already present in build path before building
    clean: true,
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
}
