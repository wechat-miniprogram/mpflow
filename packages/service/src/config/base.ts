import { Plugin } from '@mpflow/service-core'
import MpflowPlugin from '@mpflow/webpack-plugin'
import path from 'path'

const base: Plugin = (api, config) => {
  api.configureWebpack(({ addConfig, configure }, mode) => {
    const app = typeof config.app === 'function' ? config.app(mode) : config.app
    const plugin = typeof config.plugin === 'function' ? config.plugin(mode) : config.plugin
    const pages = typeof config.pages === 'function' ? config.pages(mode) : config.pages
    const libs = typeof config.libs === 'function' ? config.libs(mode) : config.libs

    const sourceMap = typeof config.sourceMap === 'function' ? config.sourceMap(mode) : config.sourceMap ?? true
    const minimize = (minimize => (typeof minimize === 'function' ? minimize(mode) : minimize))(
      config.minimize ?? ((mode: string) => mode === 'production'),
    )
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

    if (pages && pages.length) {
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

        if (libs) {
          Object.keys(libs).forEach(outputPath => {
            const entry = libs[outputPath]

            webpackConfig
              .name('libs')
              .entry(outputPath)
              .add(`${MpflowPlugin.libLoader}?outputPath=${encodeURIComponent(outputPath)}!${api.resolve(entry)}`)
              .end()
          })
        }
      })
    }

    configure(webpackConfig => {
      webpackConfig.mode(mode === 'production' ? 'production' : 'development').devtool(false)

      webpackConfig.context(api.getCwd())

      webpackConfig.output.filename('_commons/[id].js').chunkFilename('_commons/[id].js')

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
        .use('file-loader')
        .loader(require.resolve('file-loader'))
        .options({
          name: '_commons/[name].[hash:8].[ext]',
        })

      webpackConfig.module
        .rule('wxss')
        .test(/\.wxss$/)
        .pre()
        .use('@mpflow/wxss-loader')
        .loader(require.resolve('@mpflow/wxss-loader'))

      webpackConfig.module
        .rule('wxml')
        .test(/\.wxml$/)
        .pre()
        .use('@mpflow/wxml-loader')
        .loader(require.resolve('@mpflow/wxml-loader'))

      webpackConfig.module
        .rule('images')
        .test(/\.(png|jpg|jpeg|gif|svg|cer|mp3|aac|m4a|mp4|wav|ogg|silk)$/i)
        .pre()
        .use('file-loader')
        .loader(require.resolve('file-loader'))
        .options({
          name: '_assets/[name].[hash:8].[ext]',
        })

      webpackConfig.target(MpflowPlugin.target as any)

      // 生产模式，抽取公共代码
      webpackConfig.optimization
        .namedChunks(false)
        .runtimeChunk('single')
        .splitChunks({
          chunks: 'all',
          minSize: 1000,
          maxSize: 0,
          minChunks: 1,
          maxAsyncRequests: 100,
          maxInitialRequests: 100,
          automaticNameDelimiter: '~',
          name: true,
          cacheGroups: {
            common: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        })

      if (minimize) {
        const { LoaderOptionsPlugin } = require('webpack') as typeof import('webpack')
        // 生产模式，压缩代码
        webpackConfig.plugin('loader-minimize').use(LoaderOptionsPlugin, [
          {
            minimize: true,
          },
        ])
      }

      if (sourceMap) {
        const { SourceMapDevToolPlugin } = require('webpack') as typeof import('webpack')
        // 生成 sourceMap
        webpackConfig.plugin('source-map').use(SourceMapDevToolPlugin, [
          {
            append: false,
            filename: '[file].map[query]',
            module: true,
            columns: mode === 'production' ? true : false,
            test: /\.(js|wxss)($|\?)/i,
          },
        ])
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
