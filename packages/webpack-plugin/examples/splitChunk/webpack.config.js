const path = require('path')
const mpflowPlugin = require('@mpflow/webpack-plugin')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    index: `${mpflowPlugin.pageLoader}!./pages/index/index.js`,
    logs: `${mpflowPlugin.pageLoader}!./pages/logs/logs.js`,
  },

  devtool: 'none',

  output: {
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
    filename: '_commons/[id].js',
    chunkFilename: '_commons/[id].js',
    libraryTarget: 'var',
  },

  optimization: {
    namedModules: false,
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 100,
      maxInitialRequests: 100,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        common: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },

  module: {
    rules: [
      {
        test: /\.json$/,
        type: 'javascript/auto',
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

  target: mpflowPlugin.target,

  plugins: [
    new mpflowPlugin({
      resolve: {
        roots: [__dirname],
      },
    }),
  ],
}
