import { Plugin } from '@weflow/service-core'
import WeflowPlugin from '@weflow/webpack-plugin'
import path from 'path'
import qs from 'querystring'

const base: Plugin = (api, config) => {
  api.beforeConfigureWebpack(() => {
    const mode = api.mode
    const app = typeof config.app === 'function' ? config.app(mode) : config.app
    const plugin = typeof config.plugin === 'function' ? config.plugin(mode) : config.plugin
    const pages = typeof config.pages === 'function' ? config.pages(mode) : config.pages
    const sourceDir = config.sourceDir || 'src'

    const miniprogramRoot = config.miniprogramRoot || ''
    const pluginRoot = config.pluginRoot || ''
    const outputPath = api.resolve(config.outputDir || 'dist')

    if (app) {
      api.addWebpackConfig('app', webpackConfig => {
        webpackConfig
          .name('app')
          .entry('app')
          .add(`${WeflowPlugin.appLoader}!${api.resolve(app)}`)
          .end()

        webpackConfig.output.path(path.join(outputPath, miniprogramRoot))
      })
    }

    if (plugin) {
      api.addWebpackConfig('plugin', webpackConfig => {
        webpackConfig
          .name('plugin')
          .entry('plugin')
          .add(`${WeflowPlugin.pluginLoader}!${api.resolve(plugin)}`)
          .end()

        webpackConfig.output.path(path.join(outputPath, pluginRoot))
      })
    }

    if (pages) {
      api.addWebpackConfig('pages', webpackConfig => {
        pages.forEach(pageEntry => {
          const basename = path.basename(pageEntry, path.extname(pageEntry))

          webpackConfig
            .name('pages')
            .entry(basename)
            .add(`${WeflowPlugin.pageLoader}!${api.resolve(pageEntry)}`)
            .end()

          webpackConfig.output.path(outputPath)
        })
      })
    }

    api.configureWebpack(webpackConfig => {
      webpackConfig.mode(mode === 'production' ? 'production' : 'development').devtool(false)

      webpackConfig.context(api.getCwd())

      webpackConfig.output
        .libraryTarget('commonjs2')
        .filename('_commons/[name].js')
        .chunkFilename('_commons/[name].js')
        .library('webpackExports')
        .libraryTarget('global')
        .globalObject('global')
        .jsonpFunction('webpackModules')

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

      webpackConfig
        .plugin('clean')
        .use((require('clean-webpack-plugin') as typeof import('clean-webpack-plugin')).CleanWebpackPlugin, [
          {
            cleanStaleWebpackAssets: false,
          },
        ])

      // webpackConfig.plugin('copy-project').use(require('copy-webpack-plugin'), [
      //   {
      //     patterns: [api.resolve('project.config.json')],
      //   },
      // ])
    })
  })
}

export default base
