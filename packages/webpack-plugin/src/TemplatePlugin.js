import ejs from 'ejs'
import webpack from 'webpack'

const {
  sources: { RawSource },
} = webpack

const PLUGIN_NAME = 'Mpflow Template Plugin'

/**
 * TemplatePlugin 会将一个 ejs 模板渲染后添加到产物中
 */
export default class TemplatePlugin {
  /**
   * @param {object} options
   * @param {string} options.templatePath
   * @param {string} options.outputPath
   * @param {*} [options.data]
   */
  constructor(options = {}) {
    this.options = options
  }

  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    const { templatePath, outputPath, data } = this.options
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      const resolver = compiler.resolverFactory.get('normal')
      const context = compiler.options.context
      const inputFileSystem = compiler.inputFileSystem

      const resolveRequest = request =>
        new Promise((resolve, reject) => {
          resolver.resolve({}, context, request, {}, (err, result) => (err ? reject(err) : resolve(result)))
        })

      compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, async callback => {
        try {
          const resolvedTemplatePath = await resolveRequest(templatePath)

          compilation.fileDependencies.add(resolvedTemplatePath)

          const templateContent = await new Promise((resolve, reject) =>
            inputFileSystem.readFile(resolvedTemplatePath, (err, contents) =>
              err ? reject(err) : resolve(contents.toString('utf-8')),
            ),
          )

          const content = new RawSource(ejs.render(templateContent, data || {}, { async: false }))

          if (typeof compilation.emitAsset !== 'function') {
            compilation.assets[outputPath] = content

            return
          }

          if (compilation.getAsset(outputPath)) {
            return
          }

          compilation.emitAsset(outputPath, content)

          callback()
        } catch (err) {
          compilation.errors.push(err)

          return callback(err)
        }
      })
    })
  }
}
