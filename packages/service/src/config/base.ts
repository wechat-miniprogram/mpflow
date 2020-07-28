import { Plugin } from '@weflow/service-core'
import WeflowPlugin from '@weflow/webpack-plugin'
import path from 'path'
import qs from 'querystring'

const base: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    webpackConfig.mode(api.mode === 'production' ? 'production' : 'development').devtool(false)

    if (config.app) {
      webpackConfig
        .entry('app')
        .add(`${WeflowPlugin.appLoader}!${api.resolve(config.app)}`)
        .end()
    }

    if (config.plugin) {
      webpackConfig
        .entry('plugin')
        .add(`${WeflowPlugin.pluginLoader}!${api.resolve(config.plugin)}`)
        .end()
    }

    if (config.pages) {
      config.pages.forEach(pagePath => {
        const basename = path.basename(pagePath, path.extname(pagePath))

        webpackConfig
          .entry(basename)
          .add(
            `${WeflowPlugin.pageLoader}?${qs.stringify({
              outputPath: basename + '/' + basename,
            })}!${api.resolve(pagePath)}`,
          )
          .end()
      })
    }

    webpackConfig.context(api.getCwd())

    webpackConfig.output.path(api.resolve(config.outputDir || 'dist'))

    webpackConfig.resolve.extensions.add('.js').add('.json')

    webpackConfig.module
      .rule('json-type')
      .test(/\.json$/)
      .type('javascript/auto')

    webpackConfig.module
      .rule('json')
      .test(/\.json$/)
      .use('json')
      .loader(require.resolve('json-loader'))

    webpackConfig.module
      .rule('wxs')
      .test(/\.wxs$/)
      .pre()
      .use('raw-loader')
      .loader(require.resolve('raw-loader'))

    webpackConfig.target(WeflowPlugin.target as any)

    webpackConfig.plugin('copy-project').use(require('copy-webpack-plugin'), [
      {
        patterns: [api.resolve('project.config.json')],
      },
    ])
  })
}

export default base
