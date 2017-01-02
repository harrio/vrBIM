var webpack = require('webpack');
var path = require('path');

var dirs = {
  destJs:'/public/javascripts'
};

var config = {
  entry: __dirname + '/src/main.js',
  devtool: 'source-map',
  output: {
      path: __dirname + dirs.destJs,
      filename: 'main.js'
    },
  module: {
    loaders: [
      {
        test: /(\.js)$/,
        loader: 'babel',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.js)$/,
        loader: "eslint-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    root: path.resolve('./src'),
    extensions: ['', '.js']
  }
};

module.exports = config;
