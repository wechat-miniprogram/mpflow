// import ejs from 'ejs'
import { RawSource, ReplaceSource, ConcatSource } from 'webpack-sources'
import ModuleFilenameHelpers from 'webpack/lib/ModuleFilenameHelpers'
import Compilation from 'webpack/lib/Compilation'
import ExternalDependency from './ExternalDependency'
import { isExternalEntryPoint } from './utils'
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
  let relativePath = path.relative(path.dirname(outputPath), file).replace(/\\/g, '/')
  if (relativePath[0] !== '.') relativePath = './' + relativePath
  return JSON.stringify(relativePath)
}

function renderJavascriptEntry(outputPath, mainFiles, chunkFiles) {
  const renderModule = ([filename, content]) => {
    if (!content) return new RawSource(`require(${getRelativePath(outputPath, filename)})`)
    const source = new ReplaceSource(content)
    const sourceStr = source.source()
    // Webpack 5 hoists strict mode when every factory in a chunk is strict
    // (including empty entry chunks). Preserve that scope when inlining the
    // chunk as an argument to the shared runtime.
    const strictHeader = sourceStr.match(/^["']use strict["'];\s*/)
    const prefixOffset = strictHeader ? strictHeader[0].length : 0
    const prefix = 'var globalThis = this, self = this;\nmodule.exports ='
    if (sourceStr.startsWith(prefix, prefixOffset)) {
      source.replace(0, prefixOffset + prefix.length - 1, '')
    }
    const match = sourceStr.match(/[\s;]+$/)
    if (match) {
      source.replace(match.index, match.index + match[0].length, '')
    }
    return strictHeader ? new ConcatSource('(function() {\n"use strict";\nreturn ', source, ';\n}).call(this)') : source
  }

  const source = new ConcatSource()

  source.add('var globalThis = this, self = this;\n')
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

        compilation.emitAsset(filename, content, { __mpflowExternal: true })
      }

      compilation.dependencyFactories.set(ExternalDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(ExternalDependency, new ExternalDependency.Template())

      compilation.hooks.processAssets.tapPromise(
        { name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        async () => {
          try {
            const entryNames = Array.from(compilation.entrypoints.keys())
            const fileChunkMap = new Map()

            for (const entryName of entryNames) {
              const entryPoint = compilation.entrypoints.get(entryName)
              const mainFiles = new Map()
              const chunkFiles = new Map()
              const entryChunk = entryPoint.chunks.find(
                chunk => compilation.chunkGraph.getNumberOfEntryModules(chunk) > 0,
              )

              // 只处理被标记为 External 的 Entry
              const externalInfo = isExternalEntryPoint(entryPoint, compilation)
              if (!externalInfo) continue

              const { type, outputPath } = externalInfo

              // 获取 Entry 下的所有产物信息
              entryPoint.chunks.forEach(chunk => {
                const files = chunk.hasRuntime() ? mainFiles : chunkFiles
                const shouldInline = chunk.getNumberOfGroups() === 1

                chunk.files.forEach(filename => {
                  const { source: content, info: assetInfo } = compilation.getAsset(filename)

                  if (assetInfo.__mpflowExternal) return // 跳过被自己添加的

                  if (shouldInline) {
                    // 当该 chunk 只被一个 entry 引用，则将其文件内联到最终产出
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
                entryChunk.files.add(renderFilename)
              }

              if (wxssMainFiles.size || wxssChunkFiles.size) {
                const renderFilename = `${outputPath}.wxss`
                await renderTemplate(renderFilename, renderWxssEntry, wxssMainFiles, wxssChunkFiles)
                entryChunk.files.add(renderFilename)
              }

              // 删除被内联的文件
              const assetsToRemove = [
                ...filterMapValues(jsMainFiles, Boolean).keys(),
                ...filterMapValues(jsChunkFiles, Boolean).keys(),
                ...filterMapValues(wxssMainFiles, Boolean).keys(),
                ...filterMapValues(wxssChunkFiles, Boolean).keys(),
              ]
              assetsToRemove.forEach(filename => {
                compilation.deleteAsset(filename)
                fileChunkMap.get(filename).forEach(({ files }) => {
                  files.delete(filename)
                })
              })
            }
          } catch (e) {
            throw e
          }
        },
      )
    })
  }
}
export default ExternalPlugin
