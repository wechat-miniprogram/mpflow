/**
 * modified from CommonJsChunkFormatPlugin
 */
import webpack from 'webpack'

const {
  sources: { ConcatSource },
  javascript: { JavascriptModulesPlugin },
} = webpack
const { getCompilationHooks } = JavascriptModulesPlugin

const PLUGIN_NAME = 'MiniprogramChunkFormatPlugin'

/** @typedef {import("webpack").Compiler} Compiler */

export default class MiniprogramChunkFormatPlugin {
  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      const hooks = getCompilationHooks(compilation)
      hooks.render.tap(PLUGIN_NAME, source => {
        const result = new ConcatSource()
        result.add('var globalThis = this, self = this;\n')
        result.add(source)
        return result
      })
    })
  }
}
