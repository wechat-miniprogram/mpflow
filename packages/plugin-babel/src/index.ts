import { Plugin } from '@weflow/service'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    webpackConfig.module
      .rule('js')
      .test(/\.m?jsx?$/)
      .exclude.add(/node_modules/)
      .end()
      .use('babel-loader')
      .loader(require.resolve('babel-loader'))
      .options({
        cacheDirectory: true,
      })
  })
}

export default plugin
