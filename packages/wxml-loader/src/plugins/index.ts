import { WxmlNode } from '../wxml-parser'
import importPlugin from './import-plugin'
import { Plugin, PluginContext } from './type'

export * from './type'
export { importPlugin }

export function pluginRunner(
  plugins: Plugin[],
): {
  process: (ast: WxmlNode[], context?: PluginContext) => Promise<PluginContext>
} {
  return {
    process: async (ast: WxmlNode[], context: PluginContext = { messages: [] }) => {
      for (const plugin of plugins) {
        await plugin(ast, context)
      }

      return context
    },
  }
}
