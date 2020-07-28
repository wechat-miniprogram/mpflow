import ejs from 'ejs'
import { RawSource } from 'webpack-sources'

const PLUGIN_NAME = 'Weflow Template Plugin'

export default class TemplatePlugin {
  /**
   * @param {import('@weflow/webpack-plugin').Options['templates']} options
   */
  constructor(options = {}) {
    this.options = options
  }

  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
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
          const files = await Promise.all(
            this.options.map(async ({ template, to, data }) => {
              try {
                const resolvedTemplatePath = await resolveRequest(template)

                compilation.fileDependencies.add(resolvedTemplatePath)

                const templateContent = await new Promise((resolve, reject) =>
                  inputFileSystem.readFile(resolvedTemplatePath, (err, contents) => (err ? reject(err) : resolve(contents.toString('utf-8')))),
                )

                const content = new RawSource(ejs.render(templateContent, data || {}, { async: false }))

                return {
                  to,
                  content,
                }
              } catch (err) {
                compilation.errors.push(err)

                return null
              }
            }),
          )

          files.forEach(file => {
            if (!file) return
            const { to, content } = file

            if (typeof compilation.emitAsset !== 'function') {
              compilation.assets[to] = content

              return
            }

            if (compilation.getAsset(to)) {
              return
            }

            compilation.emitAsset(to, content)
          })

          callback()
        } catch (err) {
          compilation.errors.push(err)

          return callback(err)
        }
      })
    })
  }
}
