import MiniprogramMainTemplatePlugin from './MiniprogramMainTemplatePlugin'
import MiniprogramChunkTemplatePlugin from './MiniprogramChunkTemplatePlugin'

const PLUGIN_NAME = 'Miniprogram Template Plugin'

export default class MiniprogramTemplatePlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      new MiniprogramMainTemplatePlugin().apply(compilation)
      new MiniprogramChunkTemplatePlugin().apply(compilation)
    })
  }
}
