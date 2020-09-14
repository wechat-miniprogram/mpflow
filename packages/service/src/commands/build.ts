import { Plugin } from '@mpflow/service-core'
import WebpackOutputFileSystem from '../utils/WebpackOutputFileSystem'
import { compilation } from 'webpack'

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
        const compiler = webpack(webpackConfigs)

        ;(compiler as any).outputFileSystem = new WebpackOutputFileSystem((api as any).service.outputFileSystem)

        const stats = await new Promise<compilation.MultiStats>((resolve, reject) => {
          compiler.run((err, stats) => (err ? reject(err) : resolve(stats)))
        })

        const statsJson = stats.toJson({
          all: false,
          modules: true,
          maxModules: 0,
          errors: true,
          warnings: true,
          children: true,
          assets: true,
        })
        statsJson.children!.forEach(children => {
          children.children = undefined
        })
        process.stdout.write((webpack.Stats as any).jsonToString(statsJson, true) + '\n\n')
        console.log(chalk.cyan('Build complete.\n'))
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
