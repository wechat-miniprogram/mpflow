import path from 'path'
import { ConcatSource } from 'webpack-sources'
import JavascriptModulesPlugin from 'webpack/lib/javascript/JavascriptModulesPlugin'
import RuntimeGlobals from 'webpack/lib/RuntimeGlobals'
import RuntimeModule from 'webpack/lib/RuntimeModule'
import Template from 'webpack/lib/Template'
import { isExternalEntryPoint } from '../utils'

const PLUGIN_NAME = 'Miniprogram Main Template Plugin'

class MiniprogramChunkLoadingRuntimeModule extends RuntimeModule {
  constructor(requirements) {
    super('miniprogram chunk loading', RuntimeModule.STAGE_ATTACH)
    this.requirements = requirements
  }

  generate() {
    const { chunk, compilation } = this
    const initialIds = Object.fromEntries(chunk.ids.map(id => [id, 0]))
    const filenameTemplate = JavascriptModulesPlugin.getChunkFilenameTemplate(chunk, compilation.outputOptions)
    let filename = compilation.getPath(filenameTemplate, { chunk, contentHashType: 'javascript' })
    if (chunk.getNumberOfGroups() === 1) {
      const [group] = chunk.groupsIterable
      const externalInfo = isExternalEntryPoint(group, compilation)
      if (externalInfo) filename = `${externalInfo.outputPath}.js`
    }
    const root = path.relative(path.dirname(filename), '.').replace(/\\/g, '/')
    const rootPrefix = root ? `${root}/` : './'

    return Template.asString([
      `var installedChunks = ${JSON.stringify(initialIds)};`,
      'var deferredModules = [];',
      '__webpack_require__.mpflow = function(loadModules) {',
      Template.indent([
        'var result;',
        'for(var i = 0; i < loadModules.length; i++) {',
        Template.indent([
          'var chunk = loadModules[i], moreModules = chunk.modules, chunkIds = chunk.ids;',
          'for(var moduleId in moreModules) {',
          Template.indent(
            'if(__webpack_require__.o(moreModules, moduleId)) __webpack_require__.m[moduleId] = moreModules[moduleId];',
          ),
          '}',
          'if(chunk.runtime) chunk.runtime(__webpack_require__);',
          'for(var j = 0; j < chunkIds.length; j++) installedChunks[chunkIds[j]] = 0;',
          'deferredModules.push.apply(deferredModules, chunk.entries || []);',
        ]),
        '}',
        'for(var k = 0; k < deferredModules.length; k++) {',
        Template.indent([
          'var deferredModule = deferredModules[k], fulfilled = true;',
          'for(var j = 1; j < deferredModule.length; j++) {',
          Template.indent('if(installedChunks[deferredModule[j]] !== 0) fulfilled = false;'),
          '}',
          'if(fulfilled) {',
          Template.indent([
            'deferredModules.splice(k--, 1);',
            'result = __webpack_require__(__webpack_require__.s = deferredModule[0]);',
          ]),
          '}',
        ]),
        '}',
        this.requirements.has(RuntimeGlobals.onChunksLoaded) ? '__webpack_require__.O();' : '',
        'return result;',
      ]),
      '};',
      this.requirements.has(RuntimeGlobals.onChunksLoaded)
        ? '__webpack_require__.O.mpflow = function(chunkId) { return installedChunks[chunkId] === 0; };'
        : '',
      this.requirements.has(RuntimeGlobals.ensureChunkHandlers)
        ? Template.asString([
            '__webpack_require__.f.mpflow = function(chunkId) {',
            Template.indent([
              'if(installedChunks[chunkId] !== 0) {',
              Template.indent(
                `__webpack_require__.mpflow([require(${JSON.stringify(
                  rootPrefix,
                )} + __webpack_require__.u(chunkId))]);`,
              ),
              '}',
            ]),
            '};',
          ])
        : '',
    ])
  }
}

export default class MiniprogramMainTemplatePlugin {
  apply(compilation) {
    const hooks = JavascriptModulesPlugin.getCompilationHooks(compilation)
    // External entry wrappers consume both a normal entry's exports and a shared
    // runtime's load callback. Keep entries inside factories so startup always
    // follows webpack's require/cache semantics.
    hooks.inlineInRuntimeBailout.tap(PLUGIN_NAME, () => 'miniprogram entry exports')
    compilation.hooks.additionalTreeRuntimeRequirements.tap(PLUGIN_NAME, (chunk, set) => {
      set.add(RuntimeGlobals.require)
      set.add(RuntimeGlobals.returnExportsFromRuntime)
      set.add(RuntimeGlobals.moduleFactories)
      set.add(RuntimeGlobals.hasOwnProperty)
      compilation.addRuntimeModule(chunk, new MiniprogramChunkLoadingRuntimeModule(set))
    })
    compilation.hooks.runtimeRequirementInTree
      .for(RuntimeGlobals.ensureChunkHandlers)
      .tap(PLUGIN_NAME, (chunk, set) => {
        set.add(RuntimeGlobals.getChunkScriptFilename)
      })
    hooks.renderStartup.tap(PLUGIN_NAME, (source, module, { chunk, chunkGraph }) => {
      if (chunkGraph.getNumberOfEntryModules(chunk) === 0) {
        return new ConcatSource(source, '\nreturn __webpack_require__.mpflow;\n')
      }
      return source
    })
    hooks.renderMain.tap(
      PLUGIN_NAME,
      source => new ConcatSource('var globalThis = this, self = this;\nmodule.exports =\n', source),
    )
    hooks.chunkHash.tap(PLUGIN_NAME, (chunk, hash) => hash.update(PLUGIN_NAME))
  }
}
