import { Plugin } from '@mpflow/service-core'

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
      api.mode = args.dev ? 'development' : 'production'

      const chalk = require('chalk') as typeof import('chalk')
      const webpack = require('webpack') as typeof import('webpack')

      if (args.report) {
        api.beforeConfigureWebpack(() => {
          api.configureWebpack(webpackConfig => {
            webpackConfig.plugin('bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
          })
        })
      }

      const webpackConfigs = await api.resolveWebpackConfigs()

      try {
        webpack(webpackConfigs, (err, stats) => {
          if (err) {
            console.error(err)
            process.exit(1)
          }
          process.stdout.write(
            stats.toString({
              colors: true,
              modules: false,
              children: true,
              chunks: false,
              chunkModules: false,
            }) + '\n\n',
          )
          console.log(chalk.cyan('Build complete.\n'))
        })
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
