import { Plugin } from '@mpflow/service-core'
import MpflowPlugin from '@mpflow/webpack-plugin'
import path from 'path'

const base: Plugin = (api, config) => {
  api.configureWebpack(({ addConfig, configure }, mode) => {
    const app = typeof config.app === 'function' ? config.app(mode) : config.app
    const plugin = typeof config.plugin === 'function' ? config.plugin(mode) : config.plugin
    const pages = typeof config.pages === 'function' ? config.pages(mode) : config.pages
    const sourceDir = config.sourceDir || 'src'

    const miniprogramRoot = config.miniprogramRoot || ''
    const pluginRoot = config.pluginRoot || ''
    const outputPath = api.resolve(config.outputDir || 'dist')

    if (app) {
      addConfig('app', webpackConfig => {
        webpackConfig
          .name('app')
          .entry('app')
          .add(`${MpflowPlugin.appLoader}!${api.resolve(app)}`)
          .end()

        webpackConfig.output.path(path.join(outputPath, miniprogramRoot))
      })
    }

    if (plugin) {
      addConfig('plugin', webpackConfig => {
        webpackConfig
          .name('plugin')
          .entry('plugin')
          .add(`${MpflowPlugin.pluginLoader}!${api.resolve(plugin)}`)
          .end()

        webpackConfig.output.path(path.join(outputPath, pluginRoot))
      })
    }

    if (pages) {
      addConfig('pages', webpackConfig => {
        pages.forEach(pageEntry => {
          const basename = path.basename(pageEntry, path.extname(pageEntry))

          webpackConfig
            .name('pages')
            .entry(basename)
            .add(`${MpflowPlugin.pageLoader}!${api.resolve(pageEntry)}`)
            .end()

          webpackConfig.output.path(outputPath)
        })
      })
    }

    configure(webpackConfig => {
      webpackConfig.mode(mode === 'production' ? 'production' : 'development').devtool(false)

      webpackConfig.context(api.getCwd())

      webpackConfig.output.filename('_commons/[name].js').chunkFilename('_commons/[name].js')

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
        .use('raw-loader')
        .loader(require.resolve('raw-loader'))

      webpackConfig.module
        .rule('wxss')
        .test(/\.wxss$/)
        .use('@mpflow/wxss-loader')
        .loader(require.resolve('@mpflow/wxss-loader'))

      webpackConfig.module
        .rule('wxml')
        .test(/\.wxml$/)
        .use('@mpflow/wxml-loader')
        .loader(require.resolve('@mpflow/wxml-loader'))

      webpackConfig.module
        .rule('images')
        .test(/\.(png|jpg|jpeg|gif|svg|cer|mp3|aac|m4a|mp4|wav|ogg|silk)$/i)
        .use('file-loader')
        .loader(require.resolve('file-loader'))
        .options({
          name: '_assets/[name].[hash:8].[ext]',
        })

      webpackConfig.target(MpflowPlugin.target as any)

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

      if ((config as any)._clean !== false) {
        webpackConfig
          .plugin('clean')
          .use((require('clean-webpack-plugin') as typeof import('clean-webpack-plugin')).CleanWebpackPlugin, [
            {
              cleanStaleWebpackAssets: false,
            },
          ])
      }

      webpackConfig.plugin('progress').use((require('webpack') as typeof import('webpack')).ProgressPlugin, [{}])
    })
  })
}

export default base
