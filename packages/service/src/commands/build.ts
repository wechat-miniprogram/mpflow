import { Plugin } from '@mpflow/service-core'
import path from 'path'
import { compilation } from 'webpack'
import WebpackOutputFileSystem from '../utils/WebpackOutputFileSystem'

const build: Plugin = (api, config) => {
  api.registerCommand(
    'build',
    '构建小程序',
    {},
    {
      dev: {
        type: 'boolean',
        description: '是否使用开发模式构建',
      },
      report: {
        type: 'boolean',
        description: '是否检查构建报告',
      },
    },
    async args => {
      api.setMode(args.dev ? 'development' : 'production')

      const chalk = require('chalk') as typeof import('chalk')
      const webpack = require('webpack') as typeof import('webpack')

      if (args.report) {
        api.configureWebpack(({ configure }) => {
          configure(webpackConfig => {
            webpackConfig.plugin('bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
          })
        })
      }

      const webpackConfigs = Object.values(await api.resolveWebpackConfigs())

      try {
        // 开始构建前，清理输出目录
        await api.rmrf(path.join(api.resolve(config.outputDir || 'dist'), '*'))

        const compiler = webpack(webpackConfigs)

        ;(compiler as any).outputFileSystem = new WebpackOutputFileSystem((api as any).service.outputFileSystem)

        const stats = await new Promise<compilation.MultiStats>((resolve, reject) => {
          compiler.run((err, stats) => (err ? reject(err) : resolve(stats)))
        })

        if (stats.hasErrors()) throw new Error('Webpack build with errors.')
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  )
}

build.generator = (api, config) => {
  api.extendPackage({
    scripts: {
      build: 'mpflow-service build',
    },
  })
}

export default build
