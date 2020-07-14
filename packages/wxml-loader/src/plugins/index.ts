import { WxmlNode } from '../wxml-parser'
import importPlugin from './import-plugin'
import { Plugin, PluginContext } from './type'

export * from './type'
export { importPlugin }

export function pluginRunner(plugins: Plugin[]) {
  return {
    process: (ast: WxmlNode[], context: PluginContext = { messages: [] }) => {
      plugins.forEach(plugin => plugin(ast, context))

      return context
    },
  }
}
