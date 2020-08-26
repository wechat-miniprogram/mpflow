import { ConcatSource } from 'webpack-sources'
import Template from 'webpack/lib/Template'

const PLUGIN_NAME = 'Miniprogram Main Template Plugin'

export default class MainTemplatePlugin {
  constructor() {}

  apply(mainTemplate) {
    const needChunkOnDemandLoadingCode = chunk => {
      for (const chunkGroup of chunk.groupsIterable) {
        if (chunkGroup.chunks.length > 1) return true
        if (chunkGroup.getNumberOfChildren() > 0) return true
      }
      return false
    }
    mainTemplate.hooks.render.tap(PLUGIN_NAME, (source, chunk, hash) => {
      const varExpression = mainTemplate.getAssetPath('module.exports', { hash, chunk })
      const resultSource = new ConcatSource()

      resultSource.add(`var globalThis = this;\n`)
      resultSource.add(`${varExpression} = \n`)
      resultSource.add(source)

      return resultSource
    })
    mainTemplate.hooks.bootstrap.tap(PLUGIN_NAME, (source, chunk, hash) => {
      if (needChunkOnDemandLoadingCode(chunk)) {
        return Template.asString([
          source,
          '',
          'function webpackLoadCallback(loadModules) {',
          Template.indent([
            'var i = 0, j, k = 0;',
            'var deferredModules = [], result;',
            'var module, chunkIds, chunkId, moreModules, executeModules, moduleId;',
            'var deferredModule, fulfilled, depId;',
            '',
            'for (; i < loadModules.length; ++i) {',
            Template.indent([
              'module = loadModules[i];',
              'chunkIds = module.ids;',
              'moreModules = module.modules;',
              'executeModules = module.entries || [];',
              '',
              'for(j = 0; j < chunkIds.length; j++) {',
              Template.indent(['chunkId = chunkIds[j];', 'installedChunks[chunkId] = 0;']),
              '}',
              'for(moduleId in moreModules) {',
              Template.indent([
                'if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {',
                Template.indent(['modules[moduleId] = moreModules[moduleId];']),
                '}',
              ]),
              '}',
              '',
              'deferredModules.push.apply(deferredModules, executeModules || []);',
            ]),
            '}',
            '',
            'for(; k < deferredModules.length; k++) {',
            Template.indent([
              'deferredModule = deferredModules[k];',
              'fulfilled = true;',
              'for(j = 1; j < deferredModule.length; j++) {',
              Template.indent(['depId = deferredModule[j];', 'if(installedChunks[depId] !== 0) fulfilled = false;']),
              '}',
              'if(fulfilled) {',
              Template.indent([
                'deferredModules.splice(k--, 1);',
                'result = __webpack_require__(__webpack_require__.s = deferredModule[0]);',
              ]),
              '}',
            ]),
            '}',
            '',
            'return result;',
          ]),
          '};',
        ])
      }
    })
    mainTemplate.hooks.localVars.tap(PLUGIN_NAME, (source, chunk) => {
      if (needChunkOnDemandLoadingCode(chunk)) {
        return Template.asString([
          source,
          '',
          '// object to store loaded chunks',
          '// "0" means "already loaded"',
          'var installedChunks = {',
          Template.indent(chunk.ids.map(id => `${JSON.stringify(id)}: 0`).join(',\n')),
          '};',
        ])
      }
      return source
    })
    mainTemplate.hooks.requireExtensions.tap(PLUGIN_NAME, (source, chunk) => {
      if (needChunkOnDemandLoadingCode(chunk)) {
        return Template.asString([
          source,
          '',
          '// uncaught error handler for webpack runtime',
          `${mainTemplate.requireFn}.oe = function(err) {`,
          Template.indent([
            'process.nextTick(function() {',
            Template.indent('throw err; // catch this error by using import().catch()'),
            '});',
          ]),
          '};',
        ])
      }
      return source
    })
    mainTemplate.hooks.requireEnsure.tap(PLUGIN_NAME, (source, chunk, hash) => {
      const chunkFilename = mainTemplate.outputOptions.chunkFilename
      const chunkMaps = chunk.getChunkMaps()
      const insertMoreModules = [
        'var moreModules = chunk.modules, chunkIds = chunk.ids;',
        'for(var moduleId in moreModules) {',
        Template.indent(mainTemplate.renderAddModule(hash, chunk, 'moduleId', 'moreModules[moduleId]')),
        '}',
      ]

      const request = mainTemplate.getAssetPath(JSON.stringify(`./${chunkFilename}`), {
        hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
        hashWithLength: length => `" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
        chunk: {
          id: '" + chunkId + "',
          hash: `" + ${JSON.stringify(chunkMaps.hash)}[chunkId] + "`,
          hashWithLength: length => {
            const shortChunkHashMap = {}
            for (const chunkId of Object.keys(chunkMaps.hash)) {
              if (typeof chunkMaps.hash[chunkId] === 'string') {
                shortChunkHashMap[chunkId] = chunkMaps.hash[chunkId].substr(0, length)
              }
            }
            return `" + ${JSON.stringify(shortChunkHashMap)}[chunkId] + "`
          },
          contentHash: {
            javascript: `" + ${JSON.stringify(chunkMaps.contentHash.javascript)}[chunkId] + "`,
          },
          contentHashWithLength: {
            javascript: length => {
              const shortContentHashMap = {}
              const contentHash = chunkMaps.contentHash.javascript
              for (const chunkId of Object.keys(contentHash)) {
                if (typeof contentHash[chunkId] === 'string') {
                  shortContentHashMap[chunkId] = contentHash[chunkId].substr(0, length)
                }
              }
              return `" + ${JSON.stringify(shortContentHashMap)}[chunkId] + "`
            },
          },
          name: `" + (${JSON.stringify(chunkMaps.name)}[chunkId]||chunkId) + "`,
        },
        contentHashType: 'javascript',
      })
      return Template.asString([
        source,
        '',
        '// require() chunk loading for javascript',
        '',
        '// "0" is the signal for "already loaded"',
        'if(installedChunks[chunkId] !== 0) {',
        Template.indent(
          [`var chunk = require(${request});`]
            .concat(insertMoreModules)
            .concat(['for(var i = 0; i < chunkIds.length; i++)', Template.indent('installedChunks[chunkIds[i]] = 0;')]),
        ),
        '}',
      ])
    })
    mainTemplate.hooks.startup.tap(PLUGIN_NAME, (source, chunk, hash) => {
      if (!chunk.entryModule) {
        return Template.asString(['// return load module function', 'return webpackLoadCallback;'])
      }
    })
    mainTemplate.hooks.hash.tap(PLUGIN_NAME, hash => {
      hash.update(PLUGIN_NAME)
      hash.update('4')
    })
  }
}
