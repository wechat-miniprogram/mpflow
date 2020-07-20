import { Plugin } from '@weflow/service'
import path from 'path'

const plugin: Plugin = (api, config) => {
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
}

plugin.generator = async api => {
  await api.render(path.resolve(__dirname, '../template'))
}

export default plugin
