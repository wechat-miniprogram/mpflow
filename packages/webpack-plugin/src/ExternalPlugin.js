import ejs from 'ejs'
import { RawSource } from 'webpack-sources'
import ModuleFilenameHelpers from 'webpack/lib/ModuleFilenameHelpers'
import ExternalDependency from './ExternalDependency'
import { isExternalEntryPoint, markAsExternal } from './utils'

const PLUGIN_NAME = 'Mpflow External Plugin'

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
    })

    compiler.hooks.emit.tapAsync(PLUGIN_NAME, async (compilation, callback) => {
      try {
        const entryNames = Array.from(compilation.entrypoints.keys())

        for (const entryName of entryNames) {
          const entryPoint = compilation.entrypoints.get(entryName)
          const entryPointFiles = entryPoint.getFiles()

          const externalInfo = isExternalEntryPoint(entryPoint)
          if (!externalInfo) return

          const { type, outputPath } = externalInfo

          const jsFiles = entryPointFiles.filter(filename =>
            ModuleFilenameHelpers.matchObject({ test: /\.js$/ }, filename),
          )
          const wxssFiles = entryPointFiles.filter(filename =>
            ModuleFilenameHelpers.matchObject({ test: /\.wxss$/ }, filename),
          )

          const renderTemplate = async (filename, templatePath, data) => {
            const contentStr = await new Promise((resolve, reject) => {
              ejs.renderFile(templatePath, data, (err, content) => (err ? reject(err) : resolve(content)))
            })
            const content = new RawSource(contentStr)

            if (typeof compilation.emitAsset !== 'function') {
              compilation.assets[filename] = content
              return
            }

            if (compilation.getAsset(filename)) {
              return
            }

            compilation.emitAsset(filename, content)
          }

          if (jsFiles.length) {
            await renderTemplate(
              `${outputPath}.js`,
              type === 'main' ? require.resolve('../template/main.js.ejs') : require.resolve('../template/page.js.ejs'),
              {
                require,
                outputPath,
                jsFiles,
              },
            )
          }

          if (wxssFiles.length) {
            await renderTemplate(`${outputPath}.wxss`, require.resolve('../template/page.wxss.ejs'), {
              require,
              outputPath,
              wxssFiles,
            })
          }
        }

        callback()
      } catch (e) {
        console.error(e)
        callback(e)
      }
    })
  }
}
export default ExternalPlugin
