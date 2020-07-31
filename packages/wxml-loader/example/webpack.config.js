const path = require('path')
const loader = require.resolve('../lib/cjs')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    app: './app',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  devtool: false,

  target: 'node',

  optimization: {
    minimize: false
  },

  module: {
    rules: [
      {
        test: /\.wxml$/,
        use: [
          loader,
        ]
      }, {
        test: /\.wxs$/,
        use: [
          'raw-loader'
        ]
      }, {
        test: /\.png$/,
        use: 'file-loader'
      }
    ]
  },
}
