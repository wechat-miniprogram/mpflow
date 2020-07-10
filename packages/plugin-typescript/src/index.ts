import { Plugin } from '@weflow/service'
import { Options } from '@weflow/webpack-plugin'
import deepmerge from 'deepmerge'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    webpackConfig.resolve.extensions.prepend('.ts').prepend('.tsx')

    webpackConfig.resolve
      .plugin('tsconfig-paths')
      .use(require('tsconfig-paths-webpack-plugin'), [{ configFile: api.resolve('tsconfig.json') }])

    webpackConfig.module
      .rule('ts')
      .test(/\.tsx?$/)
      .exclude.add(/node_modules/)
      .end()
      .use('babel-loader')
      .loader(webpackConfig.module.rule('js').use('babel-loader').get('loader'))
      .options(webpackConfig.module.rule('js').use('babel-loader').get('options'))

    webpackConfig.plugin('for-ts-checker').use(require('fork-ts-checker-webpack-plugin'), [{}])

    webpackConfig.plugin('weflow').tap((options: Options[]) =>
      options.map(option =>
        deepmerge<Options, Options>(option, {
          resolve: {
            page: {
              extensions: ['.ts', '.tsx'],
            },
            javascript: {
              extensions: ['.ts', '.tsx'],
            },
          },
        }),
      ),
    )
  })
}

export default plugin
