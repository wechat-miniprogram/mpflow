const path = require('path')
const mpflowPlugin = require('@mpflow/webpack-plugin')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    index: `${mpflowPlugin.pageLoader}!./pages/index/index.js`,
    logs: `${mpflowPlugin.pageLoader}!./pages/logs/logs.js`,
  },

  devtool: false,

  output: {
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
    filename: '[id].js',
    chunkFilename: '[id].js',
  },

  optimization: {
    moduleIds: 'natural',
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      maxSize: Infinity,
      defaultSizeTypes: ['javascript', 'unknown', 'miniprogram/wxss', 'miniprogram/wxml', 'miniprogram/json'],
      minChunks: 1,
      cacheGroups: {
        defaultVendors: false,
      },
    },
  },

  module: {
    rules: [
      {
        test: /\.json$/,
        type: 'javascript/auto',
        enforce: 'pre',
        use: [
          {
            loader: 'json-loader',
          },
        ],
      },
      {
        test: /\.wxss$/,
        enforce: 'pre',
        use: [
          {
            loader: '@mpflow/wxss-loader',
          },
        ],
      },
      {
        test: /\.wxml$/,
        enforce: 'pre',
        use: [
          {
            loader: '@mpflow/wxml-loader',
          },
        ],
      },
      {
        test: /\.wxs$/,
        enforce: 'pre',
        loader: 'file-loader',
        options: {
          name: '[name].[hash:8].[ext]',
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|cer|mp3|aac|m4a|mp4|wav|ogg|silk)$/i,
        loader: 'file-loader',
        enforce: 'pre',
        options: {
          name: '[name].[hash:8].[ext]',
        },
      },
    ],
  },

  plugins: [
    new mpflowPlugin({
      resolve: {
        roots: [__dirname],
      },
    }),
  ],
}
