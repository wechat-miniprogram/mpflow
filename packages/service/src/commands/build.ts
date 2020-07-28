import { Plugin } from '@weflow/service-core'

const build: Plugin = (api, config) => {
  api.registerCommand(
    'build',
    '构建小程序',
    {
      dev: {
        boolean: true,
        description: '是否使用开发模式构建',
      },
    },
    async args => {
      const mode = (api.mode = args.dev ? 'development' : 'production')
      if (mode === 'development') {
        process.env.BUILD_DEV = 'true'
      } else {
        process.env.BUILD_PROD = 'true'
      }
      api.reloadConfig() // 通过上面设置的环境变量重新加载 weflow.config.js

      const chalk = require('chalk') as typeof import('chalk')
      const webpack = require('webpack') as typeof import('webpack')

      const webpackConfig = api.resolveWebpackConfig()

      webpack(webpackConfig, (err, stats) => {
        if (err) throw err
        process.stdout.write(
          stats.toString({
            colors: true,
            modules: false,
            children: false,
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
