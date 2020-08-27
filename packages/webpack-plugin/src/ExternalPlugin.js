// import ejs from 'ejs'
import { RawSource, ReplaceSource, ConcatSource } from 'webpack-sources'
import ModuleFilenameHelpers from 'webpack/lib/ModuleFilenameHelpers'
import ExternalDependency from './ExternalDependency'
import { isExternalEntryPoint, markAsExternal } from './utils'
import path from 'path'

const PLUGIN_NAME = 'Mpflow External Plugin'

function filterMapKeys(map, filter) {
  const result = new Map()
  Array.from(map.keys()).forEach(key => {
    if (filter(key)) result.set(key, map.get(key))
  })
  return result
}

function filterMapValues(map, filter) {
  const result = new Map()
  Array.from(map.keys()).forEach(key => {
    const value = map.get(key)
    if (filter(value)) result.set(key, value)
  })
  return result
}

function getRelativePath(outputPath, file) {
  let relativePath = path.relative(path.dirname(outputPath), file)
  if (relativePath[0] !== '.') relativePath = './' + relativePath
  return JSON.stringify(relativePath)
}

function renderJavascriptEntry(outputPath, mainFiles, chunkFiles) {
  const renderModule = ([filename, content]) => {
    if (!content) return new RawSource(`require(${getRelativePath(outputPath, filename)})`)
    const source = new ReplaceSource(content)
    const sourceStr = source.source()
    if (sourceStr.startsWith('var globalThis = this;\nmodule.exports =')) {
      source.replace(0, 39, '')
    }
    const match = sourceStr.match(/[\s;]+$/)
    if (match) {
      source.replace(match.index, match.index + match[0].length, '')
    }
    return source
  }

  const source = new ConcatSource()

  source.add('var globalThis = this;\n')
  source.add('module.exports =\n')
  source.add(renderModule(Array.from(mainFiles.entries())[0])) // 第一个 mainFile 为 runtime

  if (chunkFiles.size) {
    source.add('([\n')
    for (const entry of chunkFiles.entries()) {
      source.add(renderModule(entry))
      source.add(',\n')
    }
    source.add(']);\n')
  }

  return source
}

function renderWxssEntry(outputPath, mainFiles, chunkFiles) {
  const renderModule = ([filename, content]) => {
    if (!content) return new RawSource(`@import ${getRelativePath(outputPath, filename)};`)
    return content
  }

  const source = new ConcatSource()

  for (const entry of chunkFiles.entries()) {
    source.add(renderModule(entry))
    source.add('\n')
  }
  for (const entry of mainFiles.entries()) {
    source.add(renderModule(entry))
    source.add('\n')
  }

  return source
}

/**
 * 提供一个 ExternalDependency, 会将其所在的 chunk 标记为 external
 * 被标记为 external 的 chunk 会渲染出小程序页面的入口 js 和 wxss
 */
class ExternalPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
      // 渲染 ejs 模板并添加到产物 assets
      const renderTemplate = async (filename, render, mainFiles, chunkFiles) => {
        const content = render(filename, mainFiles, chunkFiles)

        compilation.emitAsset(filename, content)
      }

      const getEntryChunk = () => {
        const chunk = compilation.addChunk('miniprogram entries')
        chunk.ids = []
        return chunk
      }

      compilation.dependencyFactories.set(ExternalDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(ExternalDependency, new ExternalDependency.Template())

      normalModuleFactory.hooks.module.tap(PLUGIN_NAME, (module, createOptions) => {
        const {
          dependencies: [dependency],
        } = createOptions
        if (dependency instanceof ExternalDependency) {
          markAsExternal(module, dependency.externalType, dependency.outputPath)
        }
        return module
      })

      compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, async callback => {
        try {
          const entryNames = Array.from(compilation.entrypoints.keys())
          const fileChunkMap = new Map()

          for (const entryName of entryNames) {
            const entryPoint = compilation.entrypoints.get(entryName)
            const mainFiles = new Map()
            const chunkFiles = new Map()

            // 只处理被标记为 External 的 Entry
            const externalInfo = isExternalEntryPoint(entryPoint)
            if (!externalInfo) continue

            const { type, outputPath } = externalInfo

            // 获取 Entry 下的所有产物信息
            entryPoint.chunks.forEach(chunk => {
              const files = chunk.hasRuntime() ? mainFiles : chunkFiles
              const shouldInline = chunk.getNumberOfGroups() === 1

              chunk.files.forEach(filename => {
                if (shouldInline) {
                  // 当该 chunk 只被一个 entry 引用，则将其文件内联到最终产出
                  const content =
                    typeof compilation.getAsset === 'function'
                      ? compilation.getAsset(filename).source
                      : compilation.assets[filename]
                  if (!files.has(filename)) files.set(filename, content)
                } else {
                  // 当 chunk 被多个 entry 引用，则直接通过 require 引用
                  files.set(filename, false)
                }
                const chunks = fileChunkMap.get(filename) || new Set()
                chunks.add(chunk)
                fileChunkMap.set(filename, chunks)
              })
            })

            const jsMainFiles = filterMapKeys(mainFiles, filename =>
              ModuleFilenameHelpers.matchObject({ test: /\.js$/ }, filename),
            )
            const jsChunkFiles = filterMapKeys(chunkFiles, filename =>
              ModuleFilenameHelpers.matchObject({ test: /\.js$/ }, filename),
            )
            const wxssMainFiles = filterMapKeys(mainFiles, filename =>
              ModuleFilenameHelpers.matchObject({ test: /\.wxss$/ }, filename),
            )
            const wxssChunkFiles = filterMapKeys(chunkFiles, filename =>
              ModuleFilenameHelpers.matchObject({ test: /\.wxss$/ }, filename),
            )

            if (jsMainFiles.size || jsChunkFiles.size) {
              const renderFilename = `${outputPath}.js`
              await renderTemplate(renderFilename, renderJavascriptEntry, jsMainFiles, jsChunkFiles)
              getEntryChunk().files.push(renderFilename)
            }

            if (wxssMainFiles.size || wxssChunkFiles.size) {
              const renderFilename = `${outputPath}.wxss`
              await renderTemplate(renderFilename, renderWxssEntry, wxssMainFiles, wxssChunkFiles)
              getEntryChunk().files.push(renderFilename)
            }

            // 删除被内联的文件
            const assetsToRemove = [
              ...filterMapValues(jsMainFiles, Boolean).keys(),
              ...filterMapValues(jsChunkFiles, Boolean).keys(),
              ...filterMapValues(wxssMainFiles, Boolean).keys(),
              ...filterMapValues(wxssChunkFiles, Boolean).keys(),
            ]
            assetsToRemove.forEach(filename => {
              delete compilation.assets[filename]
              compilation.assetsInfo.delete(filename)
              fileChunkMap.get(filename).forEach(({ files }) => {
                files.splice(files.indexOf(filename), 1)
              })
            })
          }

          callback()
        } catch (e) {
          console.error(e)
          callback(e)
        }
      })
    })
  }
}
export default ExternalPlugin
