import { Plugin } from '@weflow/service-core'

const build: Plugin = (api, config) => {
  api.registerCommand(
    'build',
    '构建小程序',
    {},
    {
      dev: {
        boolean: true,
        description: '是否使用开发模式构建',
      },
    },
    async args => {
      api.mode = args.dev ? 'development' : 'production'

      const chalk = require('chalk') as typeof import('chalk')
      const webpack = require('webpack') as typeof import('webpack')

      const webpackConfigs = await api.resolveWebpackConfigs()

      webpack(webpackConfigs, (err, stats) => {
        if (err) throw err
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
    },
  )
}

build.generator = (api, config) => {
  api.extendPackage({
    scripts: {
      build: 'weflow-service build',
    },
  })
}

export default build
