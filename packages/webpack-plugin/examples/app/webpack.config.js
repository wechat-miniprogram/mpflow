const path = require('path')
const weflowPlugin = require('@weflow/webpack-plugin')

module.exports = {
  mode: 'development',

  context: __dirname,

  entry: {
    app: `${weflowPlugin.appLoader}!./app`,
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
