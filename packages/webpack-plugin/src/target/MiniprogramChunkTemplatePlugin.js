import { ConcatSource } from 'webpack-sources'
import JavascriptModulesPlugin from 'webpack/lib/javascript/JavascriptModulesPlugin'
import Template from 'webpack/lib/Template'

const PLUGIN_NAME = 'Miniprogram Chunk Template Plugin'

const getEntryInfo = (chunk, chunkGraph) =>
  Array.from(chunkGraph.getChunkEntryModulesWithChunkGroupIterable(chunk), ([module, group]) =>
    [chunkGraph.getModuleId(module)].concat(
      group.chunks
        .filter(
          other => other !== chunk && (other.hasRuntime() || JavascriptModulesPlugin.chunkHasJs(other, chunkGraph)),
        )
        .map(other => other.id),
    ),
  )

export default class MiniprogramChunkTemplatePlugin {
  apply(compilation) {
    const hooks = JavascriptModulesPlugin.getCompilationHooks(compilation)
    hooks.renderChunk.tap(PLUGIN_NAME, (modules, renderContext) => {
      const { chunk, chunkGraph } = renderContext
      const source = new ConcatSource(
        'var globalThis = this, self = this;\nmodule.exports = {\n',
        `"ids": ${JSON.stringify(chunk.ids)},\n"modules":`,
        modules,
      )
      const runtimeModules = chunkGraph.getChunkRuntimeModulesInOrder(chunk)
      if (runtimeModules.length) {
        source.add(',\n"runtime": ')
        source.add(Template.renderChunkRuntimeModules(runtimeModules, renderContext))
      }
      const entries = getEntryInfo(chunk, chunkGraph)
      if (entries.length) source.add(`,\n"entries": ${JSON.stringify(entries)}\n`)
      source.add('};\n')
      return source
    })
    hooks.chunkHash.tap(PLUGIN_NAME, (chunk, hash, { chunkGraph }) => {
      hash.update(PLUGIN_NAME)
      hash.update(JSON.stringify(getEntryInfo(chunk, chunkGraph)))
    })
  }
}
