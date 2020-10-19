const path = require('path')
const mpflowPlugin = require('@mpflow/webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    app: `${mpflowPlugin.pageLoader}!./pages/index/index`,
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
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.wxml$/,
        enforce: 'pre',
        use: [
          {
            loader: '@mpflow/wxml-loader',
            options: {
              sourceMap: true,
            },
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
    new webpack.SourceMapDevToolPlugin({
      append: false,
      filename: '[file].map[query]',
      module: true,
      columns: true,
      test: /\.(js|wxss)($|\?)/i,
      fallbackModuleFilenameTemplate: 'webpack://[namespace]/[resourcePath]',
    }),
    new mpflowPlugin({
      resolve: {
        roots: [__dirname],
      },
      program: {
        appId: 'wx123',
        projectName: 'app example',
        compileType: 'miniprogram',
      },
    }),
  ],
}
