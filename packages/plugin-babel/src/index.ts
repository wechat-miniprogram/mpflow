import { Plugin } from '@weflow/service-core'
import path from 'path'

const plugin: Plugin = (api, config) => {
  api.beforeConfigureWebpack(() => {
    api.configureWebpack(webpackConfig => {
      webpackConfig.module
        .rule('js')
        .test(/\.m?jsx?$/)
        .enforce('pre')
        .exclude.add(/node_modules/)
        .end()
        .use('babel-loader')
        .loader(require.resolve('babel-loader'))
        .options({
          cacheDirectory: true,
        })
    })
  })
}

plugin.generator = api => {
  api.render(path.resolve(__dirname, '../template'))
}

export default plugin
