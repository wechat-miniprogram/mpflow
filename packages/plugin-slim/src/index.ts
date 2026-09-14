import { Plugin } from '@mpflow/service-core'
import path from 'path'
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'
import { getImageminMinimizer, markMinimizedModuleAssets } from './imagemin'

interface Options {
  imagemin?: {
    jpg?: boolean | Record<string, unknown>
    gif?: boolean | Record<string, unknown>
    png?: boolean | Record<string, unknown>
    svg?: boolean | Record<string, unknown>
    plugins?: any[]
  }
}

const plugin: Plugin<Options> = (api, config, options) => {
  api.registerCommand(
    'slim-cpd [dir]',
    '检测源代码代码相似度',
    {
      dir: {
        type: 'string',
        describe: '需要检测的目录路径',
        default: config.sourceDir || 'src',
      },
    },
    {
      output: {
        type: 'string',
        alias: 'o',
        describe: '检测报告输出路径',
        default: 'report',
      },
    },
    async args => {
      const { jscpd } = require('jscpd')
      await jscpd(['', '', '-c', api.resolve('jscpd.json'), '-o', args.output, args.dir])
    },
  )

  api.configureWebpack(({ configure }) => {
    configure(webpackConfig => {
      const customPlugins = options.imagemin?.plugins || []
      const loaderOptions: {
        minimizer: ReturnType<typeof getImageminMinimizer> | ReturnType<typeof getImageminMinimizer>[]
        severityError: 'warning' | 'error'
      }[] = []
      const optionsForLoader = (plugins: any[], precedingPlugins: any[] = []) => {
        const minimizer = getImageminMinimizer(plugins)
        const options = {
          // Separate worker stages preserve the old loaders' recovery boundary:
          // a failed stage returns its input, then the following stage still runs.
          minimizer: precedingPlugins.length ? [getImageminMinimizer(precedingPlugins), minimizer] : minimizer,
          severityError: 'warning' as 'warning' | 'error',
        }
        loaderOptions.push(options)
        return options
      }
      const enabledFormats: RegExp[] = []
      const addImageRule = (format: string, test: RegExp, plugins: any[]) => {
        enabledFormats.push(test)
        webpackConfig.module
          .rule(`imagemin-${format}`)
          .test(test)
          .enforce('pre')
          .use('imagemin-loader')
          .loader(ImageMinimizerPlugin.loader)
          .options(optionsForLoader(plugins, customPlugins))
      }

      if (options.imagemin?.jpg)
        addImageRule('jpg', /\.jpe?g$/i, [[require.resolve('imagemin-jpegtran'), { progressive: true }]])

      if (options.imagemin?.gif)
        addImageRule('gif', /\.gif$/i, [[require.resolve('imagemin-gifsicle'), { interlaced: true }]])

      if (options.imagemin?.png)
        addImageRule('png', /\.png$/i, [[require.resolve('imagemin-optipng'), { optimizationLevel: 5 }]])

      if (options.imagemin?.svg)
        addImageRule('svg', /\.svg$/i, [[require.resolve('imagemin-svgo'), { plugins: [{ removeViewBox: false }] }]])

      if (customPlugins.length) {
        const test = /\.(jpe?g|png|gif|tif|webp|svg)$/i
        const rule = webpackConfig.module.rule('imagemin-custom').test(test).enforce('pre')
        for (const format of enabledFormats) rule.exclude.add(format)
        rule.use('imagemin-loader').loader(ImageMinimizerPlugin.loader).options(optionsForLoader(customPlugins))
      }

      if (loaderOptions.length)
        webpackConfig.plugin('imagemin').use({
          apply(compiler: import('webpack').Compiler) {
            // User configureWebpack callbacks run after plugin configuration, so
            // read bail from the final compiler options just as the old loader did.
            const severityError = compiler.options.bail ? 'error' : 'warning'
            for (const options of loaderOptions) options.severityError = severityError
            if (customPlugins.length) {
              new ImageMinimizerPlugin({
                loader: false,
                test: /\.(jpe?g|png|gif|tif|webp|svg)$/i,
                minimizer: getImageminMinimizer(customPlugins),
                severityError,
              }).apply(compiler)
              markMinimizedModuleAssets(compiler)
            }
          },
        })
    })
  })
}

plugin.generator = (api, config, options) => {
  api.extendPackage({
    scripts: {
      'slim:cpd': 'mpflow-service slim-cpd',
    },
  })
  api.renderDir(path.resolve(__dirname, '../template'))
}

plugin.postInstall = async (api, config) => {
  return {
    imagemin: {
      jpg: true,
      gif: true,
      png: true,
      svg: true,
    },
  }
}

export default plugin
