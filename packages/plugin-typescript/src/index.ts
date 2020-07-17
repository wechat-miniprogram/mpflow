import { Plugin, WeflowPluginConfigChain } from '@weflow/service'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    webpackConfig.resolve.extensions.prepend('.ts').prepend('.tsx')

    webpackConfig.resolve
      .plugin('tsconfig-paths')
      .use(require('tsconfig-paths-webpack-plugin'), [{ configFile: api.resolve('tsconfig.json') }])

    webpackConfig.module
      .rule('ts')
      .test(/\.tsx?$/)
      .pre()
      .exclude.add(/node_modules/)
      .end()
      .use('babel-loader')
      .loader(webpackConfig.module.rule('js').use('babel-loader').get('loader'))
      .options(webpackConfig.module.rule('js').use('babel-loader').get('options'))

    webpackConfig.plugin('for-ts-checker').use(require('fork-ts-checker-webpack-plugin'), [{}])

    webpackConfig.plugin('weflow').tap(([config]: [WeflowPluginConfigChain]) => {
      config.resolve.page.extensions.add('.ts').add('.tsx')

      config.resolve.javascript.extensions.add('.ts').add('.tsx')

      return [config]
    })
  })
}

export default plugin
