const path = require('path')
const MpPlugin = require('../lib/cjs')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    app: `${MpPlugin.appLoader}!./app`,
  },

  devtool: 'none',

  output: {
    path: path.resolve(__dirname, 'dist'),
  },

  module: {
    rules: [
      {
        test: /\.json$/,
        enforce: 'pre',
        type: 'javascript/auto',
        use: [
          'json-loader'
        ],
      },
      {
        test: /\.wxml$/,
        enforce: 'pre',
        use: [
          '@weflow/wxml-loader'
        ]
      },
      {
        test: /\.wxml$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '/_templates/[name].[contenthash:8].[ext]'
            }
          },
          {
            loader: 'extract-loader',
          },
        ]
      },
      {
        test: /\.wxss$/,
        enforce: 'pre',
        use: [
          '@weflow/wxss-loader'
        ]
      }
    ]
  },

  target: MpPlugin.target,

  plugins: [
    new MpPlugin({}),
  ],
}
