const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackPluginServe } = require('webpack-plugin-serve');

module.exports = {
  entry: ['./src/index.ts'],
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sdk.js',
    library: 'metricFlow',  // Simple global variable assignment
    libraryTarget: 'var',   // Direct window assignment
    umdNamedDefine: false,
    globalObject: 'this'
  },

  plugins: [
    new WebpackPluginServe({
      port: 9000,
      static:[
        path.resolve(__dirname, 'dist'),
        path.resolve(__dirname, 'examples'),
      ],
      liveReload: true,
      waitForBuild: true,
      host: '127.0.0.1'
    })
  ],

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              module: 'ESNext',
              target: 'ES5',
              noEmit: false
            }
          }
        },
        exclude: /node_modules/
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  watch: true
};