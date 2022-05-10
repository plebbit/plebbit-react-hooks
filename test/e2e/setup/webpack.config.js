// use these webpack config to create an in memory dev server to
// use for testing in browser

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const rootPath = path.resolve(__dirname, '..', '..', '..')
const entryPath = path.resolve(__dirname, '..', 'react-app', 'index.tsx')

// dev mode creates the files in memory so buildPath will be ignored
const buildPath = path.resolve(rootPath, 'build')

module.exports = {
  target: ['web'],

  entry: entryPath,

  // dev mode creates the files in memory
  mode: 'development',

  // add stack trace for errors
  devtool: 'inline-source-map',

  module: {
    rules: [
      // transpile typescript
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // fix error: /node_modules/jose/dist/browser/runtime/env.js 
      // The request 'process/browser' failed to resolve only because it was resolved as fully specified
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        },
      }
    ]
  },

  plugins: [
    // create some html file, not just the .js bundle
    new HtmlWebpackPlugin(),

    // fix process polyfill
    new webpack.ProvidePlugin({process: 'process/browser'}),

    // fix Buffer is not defined
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  ],

  // options of the .js bundle
  output: {
    filename: 'bundle.js',
    // dev mode creates the files in memory so buildPath will be ignored
    path: buildPath,
    // delete files already present in build path before building
    clean: true,
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],

    // fix polyfills
    fallback: {
      // keep the / it is recommended
      'assert': require.resolve('assert/'),
      'buffer': require.resolve('buffer/'),
      'crypto': require.resolve('browser-crypto'),
      'path': require.resolve('path-browserify'),
      'stream': false,
      'util': false,
      'os': false,
      'url': false,
      'fs': false,
      'timers': false,
      'tty': false,
    },

    // remove modules that dont work in browser
    alias: {
      'knex': false
    }
  },
}
