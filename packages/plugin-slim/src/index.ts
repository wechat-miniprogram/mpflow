import { Plugin } from '@mpflow/service-core'
import path from 'path'

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
      const ImageminPlugin = require('imagemin-webpack')

      if (options.imagemin?.jpg)
        webpackConfig.module
          .rule('imagemin-jpg')
          .test(/\.jpe?g$/i)
          .enforce('pre')
          .use('imagemin-loader')
          .loader(ImageminPlugin.loader)
          .options({
            cache: true,
            imageminOptions: {
              plugins: [[require.resolve('imagemin-jpegtran'), { progressive: true }]],
            },
          })

      if (options.imagemin?.gif)
        webpackConfig.module
          .rule('imagemin-gif')
          .test(/\.gif$/i)
          .enforce('pre')
          .use('imagemin-loader')
          .loader(ImageminPlugin.loader)
          .options({
            cache: true,
            imageminOptions: {
              plugins: [[require.resolve('imagemin-gifsicle'), { interlaced: true }]],
            },
          })

      if (options.imagemin?.png)
        webpackConfig.module
          .rule('imagemin-png')
          .test(/\.png$/i)
          .enforce('pre')
          .use('imagemin-loader')
          .loader(ImageminPlugin.loader)
          .options({
            cache: true,
            imageminOptions: {
              plugins: [[require.resolve('imagemin-optipng'), { optimizationLevel: 5 }]],
            },
          })

      if (options.imagemin?.svg)
        webpackConfig.module
          .rule('imagemin-svg')
          .test(/\.svg$/i)
          .enforce('pre')
          .use('imagemin-loader')
          .loader(ImageminPlugin.loader)
          .options({
            cache: true,
            imageminOptions: {
              plugins: [
                [
                  require('imagemin-svgo'),
                  {
                    plugins: [
                      {
                        removeViewBox: false,
                      },
                    ],
                  },
                ],
              ],
            },
          })

      if (options.imagemin?.plugins?.length) {
        webpackConfig.plugin('imagemin').use(ImageminPlugin, [
          {
            cache: true,
            imageminOptions: {
              plugins: options.imagemin?.plugins,
            },
          },
        ])
      }
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
