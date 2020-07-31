import { Plugin } from '@weflow/service-core'
import WeflowPlugin from '@weflow/webpack-plugin'
import path from 'path'
import qs from 'querystring'

const base: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    const mode = api.mode
    const app = config.app
    const plugin = config.plugin
    const pages = config.pages
    const sourceDir = config.sourceDir || 'src'
    const miniprogramRoot = config.miniprogramRoot || ''
    const pluginRoot = config.pluginRoot || ''

    webpackConfig.mode(api.mode === 'production' ? 'production' : 'development').devtool(false)

    if (app) {
      const appEntry = typeof app === 'function' ? app(mode) : app
      webpackConfig
        .entry('app')
        .add(
          `${WeflowPlugin.appLoader}?${qs.stringify({
            appContext: api.resolve(sourceDir, miniprogramRoot),
          })}!${api.resolve(appEntry)}`,
        )
        .end()
    }

    if (plugin) {
      const pluginEntry = typeof plugin === 'function' ? plugin(mode) : plugin
      webpackConfig
        .entry('plugin')
        .add(
          `${WeflowPlugin.pluginLoader}?${qs.stringify({
            appContext: api.resolve(sourceDir, pluginRoot),
          })}!${api.resolve(pluginEntry)}`,
        )
        .end()
    }

    if (pages) {
      const pageEntries = typeof pages === 'function' ? pages(mode) : pages
      pageEntries.forEach(pageEntry => {
        const basename = path.basename(pageEntry, path.extname(pageEntry))

        webpackConfig
          .entry(basename)
          .add(
            `${WeflowPlugin.pageLoader}?${qs.stringify({
              appContext: api.resolve(sourceDir, miniprogramRoot),
            })}!${api.resolve(pageEntry)}`,
          )
          .end()
      })
    }

    webpackConfig.context(api.getCwd())

    webpackConfig.output
      .path(api.resolve(config.outputDir || 'dist'))
      .filename('_commons/[name].js')
      .chunkFilename('_commons/[name].js')
      .globalObject('global')

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

    if (mode === 'production') {
      webpackConfig.optimization.runtimeChunk('single').splitChunks({
        chunks: 'all',
        minSize: 0,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 100,
        maxInitialRequests: 100,
        automaticNameDelimiter: '~',
        name: true,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          common: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      })
    }

    webpackConfig.plugin('clean').use(require('clean-webpack-plugin').CleanWebpackPlugin)

    // webpackConfig.plugin('copy-project').use(require('copy-webpack-plugin'), [
    //   {
    //     patterns: [api.resolve('project.config.json')],
    //   },
    // ])
  })
}

export default base
