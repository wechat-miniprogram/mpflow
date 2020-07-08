import chalk from 'chalk'
import webpack from 'webpack'
import { Plugin } from '../PluginAPI'

const build: Plugin = (api, config) => {
  api.registerCommand('build', '构建小程序', {}, args => {
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
