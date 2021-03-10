import VirtualDependency from './VirtualDependency'
import VirtualModule from './VirtualModule'

const PLUGIN_NAME = 'Mpflow Virtual Plugin'

/**
 * VirtualPlugin 提供了一个虚拟 VirtualModule
 * VirtualModule 在最后生成阶段不会产生任何代码
 */
class VirtualPlugin {
  constructor(options) {
    this.options = options
  }

  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(VirtualDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(VirtualDependency, new VirtualDependency.Template())

      normalModuleFactory.hooks.createModule.tapPromise(PLUGIN_NAME, async (createData, resolveData) => {
        const {
          dependencies: [dependency],
        } = resolveData
        if (dependency instanceof VirtualDependency) {
          return new VirtualModule(createData)
        }
      })

      // 删除只有 VirtualModule 的 chunk
      // TODO current not working
      /**
       *
       * @param {Iterable<import('webpack').Chunk>} chunks
       */
      const handler = chunks => {
        const chunkGraph = compilation.chunkGraph
        for (const chunk of chunks) {
          const virtualModules = chunkGraph.getChunkModulesIterableBySourceType(chunk, 'virtual')
          if (
            virtualModules &&
            virtualModules.size === chunkGraph.getNumberOfChunkModules(chunk) &&
            !chunk.hasRuntime() &&
            chunkGraph.getNumberOfEntryModules(chunk) === 0
          ) {
            chunkGraph.disconnectChunk(chunk)
            compilation.chunks.delete(chunk)
          }
        }
      }

      compilation.hooks.optimizeChunks.tap(
        {
          name: PLUGIN_NAME,
          stage: 0,
        },
        handler,
      )

      compilation.hooks.optimizeChunks.tap(
        {
          name: PLUGIN_NAME,
          stage: 10,
        },
        handler,
      )
    })
  }
}
export default VirtualPlugin
