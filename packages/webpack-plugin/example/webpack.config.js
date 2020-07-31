const path = require('path')
const MpPlugin = require('../lib/cjs')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    app: `${MpPlugin.appLoader}!./app`,
    // plugin: `${MpPlugin.pluginLoader}!./plugin.json`
  },

  devtool: 'none',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '_commons/[id].js',
    chunkFilename: '_commons/[id].js',
    libraryTarget: 'global',
    library: 'webpackExports',
    jsonpFunction: 'webpackModules',
    globalObject: 'global'
  },

  optimization: {
    runtimeChunk: 'single', // 必需字段，不能修改
    splitChunks: { // 代码分割配置，不建议修改
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
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    },
  },

  module: {
    rules: [
      {
        test: /\.json$/,
        type: 'javascript/auto',
      },
      {
        test: /\.wxml$/,
        use: [
          {
            loader: '@weflow/wxml-loader'
          }
        ]
      },
      {
        test: /\.wxss$/,
        use: [
          {
            loader: '@weflow/wxss-loader'
          }
        ]
      },
    ]
  },

  // target: MpPlugin.target,

  plugins: [
    new MpPlugin({
      resolve: {
        roots: [__dirname]
      }
    }),
  ],
}
