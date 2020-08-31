# `@mpflow/webpack-plugin`

> Mpflow 的小程序 Webpack 构建插件

## 说明

由于小程序与普通的 Web App 在结构上有较大差异，因此需要通过该插件支持 Webpack 对小程序代码进行构建打包。

该插件提供的能力为：

- 提供了 `app-loader`, `page-loader`, `plugin-loader` 三个 loader，作为小程序构建的入口
- 提供了一个特殊的 target, 作为小程序构建目标
- 对被标记为小程序代码中的路径解析做了特殊处理，贴合小程序原生的路径解析
- 构建后的产物会按照小程序目录结构输出
- 可以根据配置生成一个 project.config.json

## 使用

```javascript
const mpflowPlugin = require('@mpflow/webpack-plugin')

module.exports = {
  entry: {
    // 入口用 appLoader 标记
    app: `${mpflowPlugin.appLoader}!./app`,
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

  // 构建目标指定为 MpflowWebpackPlugin.target
  target: mpflowPlugin.target,

  plugins: [
    // 使用插件
    new mpflowPlugin(),
  ],
}
```

具体例子可以参考 `examples` 目录
