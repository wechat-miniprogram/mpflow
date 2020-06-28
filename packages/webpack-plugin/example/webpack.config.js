const path = require('path')
const MpPlugin = require('../lib/index').default

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: `${require.resolve('../lib/loaders/external-loader')}?name=app!${require.resolve('../lib/loaders/app-loader')}!./app.json`,

  devtool: 'none',

  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  module: {
    rules: [
      {
        test: /\.json$/, type: 'javascript/auto', use: 'json-loader'
      },
      {
        test: /\.wxml$/, use: '@weflow/wxml-loader'
      },
      {
        test: /\.wxss$/, use: '@weflow/wxss-loader'
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
