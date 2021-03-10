const path = require('path')
const mpflowPlugin = require('@mpflow/webpack-plugin')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    app: `${mpflowPlugin.pluginLoader}!./plugin.json`,
  },

  devtool: false,

  output: {
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
    filename: '[id].js',
    chunkFilename: '[id].js',
    globalObject: 'globalThis',
    chunkFormat: 'commonjs',
    chunkLoading: 'require',
    environment: {
      arrowFunction: false,
      const: false,
      destructuring: false,
      forOf: false,
      bigIntLiteral: false,
      dynamicImport: false,
      module: false,
    },
  },

  optimization: {
    moduleIds: 'natural',
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
      program: {
        appId: 'wx123',
        projectName: 'app example',
        compileType: 'plugin',
      },
    }),
  ],
}
