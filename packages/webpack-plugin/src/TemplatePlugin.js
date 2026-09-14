import ejs from 'ejs'
import Compilation from 'webpack/lib/Compilation'
import { RawSource } from 'webpack-sources'

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

      compilation.hooks.processAssets.tapPromise(
        { name: PLUGIN_NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        async () => {
          try {
            const resolvedTemplatePath = await resolveRequest(templatePath)

            compilation.fileDependencies.add(resolvedTemplatePath)

            const templateContent = await new Promise((resolve, reject) =>
              inputFileSystem.readFile(resolvedTemplatePath, (err, contents) =>
                err ? reject(err) : resolve(contents.toString('utf-8')),
              ),
            )

            const content = new RawSource(ejs.render(templateContent, data || {}, { async: false }))

            if (compilation.getAsset(outputPath)) {
              return
            }

            compilation.emitAsset(outputPath, content)
          } catch (err) {
            compilation.errors.push(err)

            throw err
          }
        },
      )
    })
  }
}
