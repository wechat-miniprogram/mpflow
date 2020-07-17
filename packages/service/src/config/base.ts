import WeflowPlugin from '@weflow/webpack-plugin'
import path from 'path'
import qs from 'querystring'
import { Plugin } from '../PluginAPI'

const base: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    webpackConfig.mode(api.mode === 'production' ? 'production' : 'development').devtool(false)

    if (config.app !== false) {
      webpackConfig
        .entry('app')
        .add(`${WeflowPlugin.appLoader}!${api.resolve(typeof config.app === 'string' ? config.app : 'src/app')}`)
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
      .rule('json')
      .test(/\.json$/)
      .type('javascript/auto')
      .pre()
      .use('json')
      .loader(require.resolve('json-loader'))

    // webpackConfig.module
    //   .rule('wxml')
    //   .test(/\.wxml$/)
    //   .pre()
    //   .use('wxml')
    //   .loader(require.resolve('@weflow/wxml-loader'))

    // webpackConfig.module
    //   .rule('wxss')
    //   .test(/\.wxss$/)
    //   .pre()
    //   .use('wxss')
    //   .loader(require.resolve('@weflow/wxss-loader'))

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
