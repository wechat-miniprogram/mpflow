import AssetDependency from './AssetDependency'
import AssetModuleFactory from './AssetModuleFactory'
import webpack from 'webpack'
import path from 'path'

const {
  sources: { RawSource, ConcatSource, OriginalSource, SourceMapSource },
} = webpack

const PLUGIN_NAME = 'Mpflow Asset Plugin'

/**
 * AssetPlugin 会将通过 asset-loader 加载的模块抽离
 * 渲染成独立文件
 */
class AssetPlugin {
  constructor(options) {
    this.options = options
  }

  /**
   * 获取 manifests
   * @param {import('webpack').Compilation} compilation
   * @param {string} type
   * @param {AssetModule[]} modules
   * @param {object} context
   * @param {import('webpack').Chunk} context.chunk
   * @param {string} context.hash
   * @param {string} context.fullHash
   * @param {import('webpack').Output} context.outputOptions
   * @param {import('webpack').CodeGenerationResults} context.codeGenerationResults
   * @param {{ javascript: import('webpack').ModuleTemplate }} context.moduleTemplates
   * @param {import('webpack').DependencyTemplates} context.dependencyTemplates
   * @param {import('webpack').RuntimeTemplate} context.runtimeTemplate
   * @param {import('webpack').ModuleGraph} context.moduleGraph
   * @param {import('webpack').ChunkGraph} context.chunkGraph
   */
  renderManifests(compilation, type, modules, context) {
    const { chunk } = context

    switch (type) {
      case 'miniprogram/json':
        // json 文件每个都独立输出到最终位置
        return modules.map(module => ({
          render: () => this.renderRawModule(compilation, module, context),
          pathOptions: { chunk },
          filenameTemplate: module.outputPath,
          identifier: module.identifier(),
        }))
      case 'miniprogram/wxss':
        // wxss 文件一起输出到 commons
        return [
          {
            render: () => this.renderWxssChunk(compilation, modules, context),
            filenameTemplate: '[id].wxss',
            pathOptions: {
              chunk,
            },
            identifier: `${type}.${chunk.id}`,
          },
        ]
      case 'miniprogram/wxml':
        // wxml 文件每个都独立输出到最终位置
        return modules.map(module => ({
          render: () => this.renderRawModule(compilation, module, context),
          pathOptions: { chunk },
          filenameTemplate: module.outputPath,
          identifier: module.identifier(),
        }))
      default:
        return []
    }
  }

  /**
   * 获取 manifests
   * @param {import('webpack').Compilation} compilation
   * @param {AssetModule} module
   * @param {object} context
   * @param {import('webpack').Chunk} context.chunk
   * @param {string} context.hash
   * @param {string} context.fullHash
   * @param {import('webpack').Output} context.outputOptions
   * @param {import('webpack').CodeGenerationResults} context.codeGenerationResults
   * @param {{ javascript: import('webpack').ModuleTemplate }} context.moduleTemplates
   * @param {import('webpack').DependencyTemplates} context.dependencyTemplates
   * @param {import('webpack').RuntimeTemplate} context.runtimeTemplate
   * @param {import('webpack').ModuleGraph} context.moduleGraph
   * @param {import('webpack').ChunkGraph} context.chunkGraph
   */
  renderRawModule(compilation, module, context) {
    if (module.sourceMap) {
      return new SourceMapSource(module.content, module.identifier(), module.sourceMap)
    } else {
      return new OriginalSource(module.content, module.identifier())
    }
  }

  /**
   * 获取 manifests
   * @param {import('webpack').Compilation} compilation
   * @param {AssetModule[]} modules
   * @param {object} context
   * @param {import('webpack').Chunk} context.chunk
   * @param {string} context.hash
   * @param {string} context.fullHash
   * @param {import('webpack').Output} context.outputOptions
   * @param {import('webpack').CodeGenerationResults} context.codeGenerationResults
   * @param {{ javascript: import('webpack').ModuleTemplate }} context.moduleTemplates
   * @param {import('webpack').DependencyTemplates} context.dependencyTemplates
   * @param {import('webpack').RuntimeTemplate} context.runtimeTemplate
   * @param {import('webpack').ModuleGraph} context.moduleGraph
   * @param {import('webpack').ChunkGraph} context.chunkGraph
   */
  renderWxssChunk(compilation, modules, context) {
    const getOutputName = chunk => {
      return compilation.getPath('[id].wxss', {
        chunk,
        contentHashType: 'miniprogram/wxss',
      })
    }

    const renderChunkModules = (modules, renderModule) => {
      const { chunk, chunkGraph } = context

      // 获取含有 wxss 的 chunk
      const dependentChunks = Array.from(chunkGraph.getChunkEntryDependentChunksIterable(chunk)).filter(
        dependentChunk =>
          !!(chunkGraph.getChunkModulesIterableBySourceType(dependentChunk, 'miniprogram/wxss') || new Set()).size,
      )

      const source = new ConcatSource()

      const selfOutputDir = path.dirname(getOutputName(chunk))

      for (const chunk of dependentChunks) {
        const outputName = getOutputName(chunk)
        source.add(`@import '${path.relative(selfOutputDir, outputName)}';\n`)
      }

      for (const module of modules) {
        source.add(renderModule(module, context))
      }

      return source
    }

    return (
      renderChunkModules(modules, module => this.renderRawModule(compilation, module, context)) || new RawSource('')
    )
  }

  /**
   * 渲染 chunk 内容
   * @param {import('webpack').compilation.Compilation} compilation
   * @param {import('webpack').compilation.Chunk} chunk
   * @param {AssetModule[]} modules
   * @param {*} requestShortener
   */
  renderContentAsset(compilation, chunk, modules, requestShortener) {
    let usedModules

    const [chunkGroup] = chunk.groupsIterable

    if (typeof chunkGroup.getModulePostOrderIndex === 'function') {
      // Store dependencies for modules
      const moduleDependencies = new Map(modules.map(m => [m, new Set()]))
      const moduleDependenciesReasons = new Map(modules.map(m => [m, new Map()]))

      // Get ordered list of modules per chunk group
      // This loop also gathers dependencies from the ordered lists
      // Lists are in reverse order to allow to use Array.pop()
      const modulesByChunkGroup = Array.from(chunk.groupsIterable, cg => {
        const sortedModules = modules
          .map(m => {
            return {
              module: m,
              index: cg.getModulePostOrderIndex(m),
            }
          })
          // eslint-disable-next-line no-undefined
          .filter(item => item.index !== undefined)
          .sort((a, b) => b.index - a.index)
          .map(item => item.module)

        for (let i = 0; i < sortedModules.length; i++) {
          const set = moduleDependencies.get(sortedModules[i])
          const reasons = moduleDependenciesReasons.get(sortedModules[i])

          for (let j = i + 1; j < sortedModules.length; j++) {
            const module = sortedModules[j]
            set.add(module)
            const reason = reasons.get(module) || new Set()
            reason.add(cg)
            reasons.set(module, reason)
          }
        }

        return sortedModules
      })

      // set with already included modules in correct order
      usedModules = new Set()

      const unusedModulesFilter = m => !usedModules.has(m)

      while (usedModules.size < modules.length) {
        let success = false
        let bestMatch
        let bestMatchDeps

        // get first module where dependencies are fulfilled
        for (const list of modulesByChunkGroup) {
          // skip and remove already added modules
          while (list.length > 0 && usedModules.has(list[list.length - 1])) {
            list.pop()
          }

          // skip empty lists
          if (list.length !== 0) {
            const module = list[list.length - 1]
            const deps = moduleDependencies.get(module)
            // determine dependencies that are not yet included
            const failedDeps = Array.from(deps).filter(unusedModulesFilter)

            // store best match for fallback behavior
            if (!bestMatchDeps || bestMatchDeps.length > failedDeps.length) {
              bestMatch = list
              bestMatchDeps = failedDeps
            }

            if (failedDeps.length === 0) {
              // use this module and remove it from list
              usedModules.add(list.pop())
              success = true
              break
            }
          }
        }

        if (!success) {
          // no module found => there is a conflict
          // use list with fewest failed deps
          // and emit a warning
          const fallbackModule = bestMatch.pop()

          if (!this.options.ignoreOrder) {
            const reasons = moduleDependenciesReasons.get(fallbackModule)
            compilation.warnings.push(
              new Error(
                [
                  `chunk ${chunk.name || chunk.id} [${PLUGIN_NAME}]`,
                  'Conflicting order. Following module has been added:',
                  ` * ${fallbackModule.readableIdentifier(requestShortener)}`,
                  'despite it was not able to fulfill desired ordering with these modules:',
                  ...bestMatchDeps.map(m => {
                    const goodReasonsMap = moduleDependenciesReasons.get(m)
                    const goodReasons = goodReasonsMap && goodReasonsMap.get(fallbackModule)
                    const failedChunkGroups = Array.from(reasons.get(m), cg => cg.name).join(', ')
                    const goodChunkGroups = goodReasons && Array.from(goodReasons, cg => cg.name).join(', ')
                    return [
                      ` * ${m.readableIdentifier(requestShortener)}`,
                      `   - couldn't fulfill desired order of chunk group(s) ${failedChunkGroups}`,
                      goodChunkGroups && `   - while fulfilling desired order of chunk group(s) ${goodChunkGroups}`,
                    ]
                      .filter(Boolean)
                      .join('\n')
                  }),
                ].join('\n'),
              ),
            )
          }

          usedModules.add(fallbackModule)
        }
      }
    } else {
      // fallback for older webpack versions
      // (to avoid a breaking change)
      // TODO remove this in next major version
      // and increase minimum webpack version to 4.12.0
      modules.sort((a, b) => a.index2 - b.index2)
      usedModules = modules
    }

    const source = new ConcatSource()

    for (const m of usedModules) {
      if (m.sourceMap) {
        source.add(new SourceMapSource(m.content, m.readableIdentifier(requestShortener), m.sourceMap))
      } else {
        source.add(new OriginalSource(m.content, m.readableIdentifier(requestShortener)))
      }
      source.add('\n')
    }

    return source
  }

  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyFactories.set(AssetDependency, new AssetModuleFactory())

      compilation.dependencyTemplates.set(AssetDependency, new AssetDependency.Template())

      compilation.hooks.renderManifest.tap(PLUGIN_NAME, (result, options) => {
        const { chunk, chunkGraph } = options

        const sourceTypes = ['miniprogram/json', 'miniprogram/wxml', 'miniprogram/wxss']

        for (const sourceType of sourceTypes) {
          const modules = Array.from(
            chunkGraph.getOrderedChunkModulesIterableBySourceType(
              chunk,
              sourceType,
              webpack.util.comparators.compareModulesById,
            ) || [],
          )

          if (!modules.length) continue

          result.push(...this.renderManifests(compilation, sourceType, modules, options))
        }

        return result
      })
    })
  }
}
export default AssetPlugin
