import chalk from 'chalk'
import { Plugin, Compiler } from 'webpack'

const pluginName = 'PrettyPlugin'

export default class PrettyPlugin extends Plugin {
  apply(compiler: Compiler) {
    compiler.hooks.done.tap(pluginName, stats => {
      const { assetsByChunkName } = stats.toJson({
        all: false,
        modules: true,
        assets: true,
      })

      const assets = Object.keys(assetsByChunkName || {}).filter(key => !key.startsWith('common~') && key !== 'runtime')

      const time = new Date().toLocaleTimeString()
      assets.forEach(name => {
        console.log(chalk.green(`[${time}]`), '📦', chalk.blue(name))
      })
      console.log(chalk.green(`[${time}]`), '🍺', chalk.magenta(`Webpack compile finished!`))
    })
  }
}
