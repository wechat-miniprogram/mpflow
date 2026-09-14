import chalk from 'chalk'
import { Compiler, WebpackPluginInstance } from 'webpack'

const pluginName = 'PrettyPlugin'

export default class PrettyPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
    compiler.hooks.done.tap(pluginName, stats => {
      if (stats.hasErrors()) {
        console.error(stats.toString('errors-only'))
        return
      }

      if (stats.hasWarnings()) {
        console.warn(stats.toString('errors-warnings'))
      }

      const { assetsByChunkName } = stats.toJson({
        all: false,
        modules: true,
        assets: true,
      })

      const assets = Object.keys(assetsByChunkName || {}).filter(key => !key.startsWith('common~') && key !== 'runtime')

      const time = new Date().toLocaleTimeString()
      const log = (...args: string[]) => console.log(chalk.green(`[${time}]`), ...args)

      if (stats.endTime && stats.startTime) {
        const duration = stats.endTime - stats.startTime
        log('⏱️ ', chalk.green(`Built in ${duration}ms`))
      }
      assets.forEach(name => {
        log('📦', chalk.blue(name))
      })
      log('🍺', chalk.magenta(`Webpack compile finished!`))
    })
  }
}
