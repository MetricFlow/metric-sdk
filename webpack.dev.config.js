const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, '/'),


      // publicPath: '/dist/' // Match the publicPath
    },
    
    compress: true,
    port: 9000,
    hot: true,
    open: true
  },
  output: {
    filename: 'sdk.dev.js',

  },
  optimization: {
    minimize: false
  }
});