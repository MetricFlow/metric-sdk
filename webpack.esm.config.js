const path = require('path');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
  output: {
    filename: 'sdk.esm.js',
    library: {
      type: 'module'
    }
  },
  experiments: {
    outputModule: true
  }
});