import { Plugin } from '../PluginAPI'

const build: Plugin = (api, config) => {
  api.registerCommand('build', '构建小程序', {}, async args => {
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
  })
}

export default build
