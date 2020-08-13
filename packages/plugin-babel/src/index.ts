import { Plugin } from '@mpflow/service-core'
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
  api.renderDir(path.resolve(__dirname, '../template'))

  api.processFile('src/**/*.js', (file, api) => {
    api.transform(require('5to6-codemod/transforms/cjs'), {})
    api.transform(require('5to6-codemod/transforms/no-strict'), {})
    api.transform(require('5to6-codemod/transforms/exports'), {})
  })
}

export default plugin
