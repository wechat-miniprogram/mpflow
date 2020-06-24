const path = require('path')
const MpPlugin = require('../lib/index').default

module.exports = {
  mode: 'production',

  context: __dirname,

  entry: {
    app: './app',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  module: {
    rules: [
      {
        test: /\.wxml$/, use: '@weflow/wxml-loader'
      }
    ]
  },

  target: MpPlugin.target,

  resolve: {
    extensions: ['.js', '.json', '.css'],
  },
  plugins: [
    new MpPlugin({
      entry: './app',
    }),
  ],
}
