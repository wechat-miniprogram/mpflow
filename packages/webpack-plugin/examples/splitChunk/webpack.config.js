const path = require('path')
const weflowPlugin = require('@weflow/webpack-plugin')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    index: `${weflowPlugin.pageLoader}!./pages/index/index.js`,
    logs: `${weflowPlugin.pageLoader}!./pages/logs/logs.js`,
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
        use: [
          {
            loader: '@weflow/wxss-loader',
          },
        ],
      },
      {
        test: /\.wxml$/,
        use: [
          {
            loader: '@weflow/wxml-loader',
          },
        ],
      },
      {
        test: /\.wxs$/,
        enforce: 'pre',
        use: [
          {
            loader: 'raw-loader',
          },
        ],
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

  target: weflowPlugin.target,

  plugins: [
    new weflowPlugin({
      resolve: {
        roots: [__dirname],
      },
    }),
  ],
}
