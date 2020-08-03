import MiniprogramMainTemplatePlugin from './MiniprogramMainTemplatePlugin'
import MiniprogramChunkTemplatePlugin from './MiniprogramChunkTemplatePlugin'
import SetVarMainTemplatePlugin from 'webpack/lib/SetVarMainTemplatePlugin'

const PLUGIN_NAME = 'Miniprogram Template Plugin'

export default class MiniprogramTemplatePlugin {
  constructor(options) {
    options = options || {}
    this.asyncChunkLoading = options.asyncChunkLoading
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      new MiniprogramMainTemplatePlugin(this.asyncChunkLoading).apply(compilation.mainTemplate)
      new MiniprogramChunkTemplatePlugin().apply(compilation.chunkTemplate)
    })
  }
}
