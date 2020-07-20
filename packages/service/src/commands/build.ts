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
      api.mode = args.dev ? 'development' : 'production'

      const { default: chalk } = await import('chalk')
      const { default: webpack } = await import('webpack')
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

export default build
