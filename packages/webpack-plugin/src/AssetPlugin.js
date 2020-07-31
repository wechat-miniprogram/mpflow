import { ConcatSource, OriginalSource, RawSource } from 'webpack-sources'
import AssetDependency from './AssetDependency'
import AssetModule from './AssetModule'
import AssetModuleFactory from './AssetModuleFactory'
import { isExternalEntryPoint } from './utils'
import ModuleFilenameHelpers from 'webpack/lib/ModuleFilenameHelpers'
import ejs from 'ejs'

const PLUGIN_NAME = 'Weflow Asset Plugin'

class MpAssetPlugin {
  constructor(options) {
    this.options = options
  }

  /**
   * 获取 manifests
   * @param {string} type
   * @param {AssetModule[]} modules
   * @param {object} context
   * @param {import('webpack').Compiler} context.compiler
   * @param {import('webpack').compilation.Compilation} context.compilation
   * @param {import('webpack').compilation.Chunk} context.chunk
   */
  renderManifests(type, modules, { compiler, compilation, chunk }) {
    switch (type) {
      case 'miniprogram/json':
        // json 文件每个都独立输出到最终位置
        return modules.map(module => ({
          render: () => new RawSource(module.content),
          pathOptions: { chunk },
          filenameTemplate: module.outputPath,
          identifier: `${PLUGIN_NAME}.${type}.${module.id}`,
          hash: module.hash,
        }))
      case 'miniprogram/wxss':
        // wxss 文件一起输出到 commons
        return [
          {
            render: () =>
              this.renderContentAsset(compilation, chunk, modules, compilation.runtimeTemplate.requestShortener),
            filenameTemplate: '_commons/[id].wxss',
            pathOptions: {
              chunk,
            },
            identifier: `${PLUGIN_NAME}.${type}.${chunk.id}`,
            hash: chunk.hash, // TODO type hash
          },
        ]
      case 'miniprogram/wxml':
        // wxml 文件每个都独立输出到最终位置
        return modules.map((module, index) => ({
          render: () => new RawSource(module.content),
          pathOptions: { chunk },
          filenameTemplate: module.outputPath,
          identifier: `${PLUGIN_NAME}.${type}.${module.id}`,
          hash: module.hash,
        }))
      default:
        return []
    }
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

    if (typeof chunkGroup.getModuleIndex2 === 'function') {
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
              index: cg.getModuleIndex2(m),
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
      source.add(new OriginalSource(m.content, m.readableIdentifier(requestShortener)))
      source.add('\n')
    }

    return source
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.dependencyFactories.set(AssetDependency, new AssetModuleFactory())

      compilation.dependencyTemplates.set(AssetDependency, new AssetDependency.Template())

      compilation.mainTemplate.hooks.renderManifest.tap(PLUGIN_NAME, (result, { chunk }) => {
        const assetModules = Array.from(chunk.modulesIterable).filter(module => module instanceof AssetModule)

        if (!assetModules.length) return

        const assetModuleTypeMap = assetModules.reduce((assetModuleTypeMap, assetModule) => {
          if (!assetModuleTypeMap[assetModule.type]) assetModuleTypeMap[assetModule.type] = []
          assetModuleTypeMap[assetModule.type].push(assetModule)
          return assetModuleTypeMap
        }, {})

        for (const type in assetModuleTypeMap) {
          result.push(...this.renderManifests(type, assetModuleTypeMap[type], { compiler, compilation, chunk }))
        }

        return result
      })

      compilation.chunkTemplate.hooks.renderManifest.tap(PLUGIN_NAME, (result, { chunk }) => {
        const assetModules = Array.from(chunk.modulesIterable).filter(module => module instanceof AssetModule)

        if (!assetModules.length) return

        const assetModuleTypeMap = assetModules.reduce((assetModuleTypeMap, assetModule) => {
          if (!assetModuleTypeMap[assetModule.type]) assetModuleTypeMap[assetModule.type] = []
          assetModuleTypeMap[assetModule.type].push(assetModule)
          return assetModuleTypeMap
        }, {})

        for (const type in assetModuleTypeMap) {
          result.push(...this.renderManifests(type, assetModuleTypeMap[type], { compiler, compilation, chunk }))
        }

        return result
      })
    })


  }
}
export default MpAssetPlugin
