import { ConcatSource } from 'webpack-sources'

/** @typedef {import("../ChunkTemplate")} ChunkTemplate */

const getEntryInfo = chunk => {
  return [chunk.entryModule].filter(Boolean).map(m =>
    [m.id].concat(
      Array.from(chunk.groupsIterable)[0]
        .chunks.filter(c => c !== chunk)
        .map(c => c.id),
    ),
  )
}

const PLUGIN_NAME = 'Miniprogram Chunk Template Plugin'

export default class ChunkTemplatePlugin {
  /**
   * @param {ChunkTemplate} chunkTemplate the chunk template
   * @returns {void}
   */
  apply(chunkTemplate) {
    chunkTemplate.hooks.render.tap(PLUGIN_NAME, (modules, chunk) => {
      // const jsonpFunction = chunkTemplate.outputOptions.jsonpFunction;
      // const globalObject = chunkTemplate.outputOptions.globalObject;
      const source = new ConcatSource()
      // const prefetchChunks = chunk.getChildIdsByOrders().prefetch;

      source.add(`var globalThis = this, self = this;\n`)
      source.add(`module.exports = {\n`)
      source.add(`"ids": ${JSON.stringify(chunk.ids)},\n`)
      source.add(`"modules":`)
      source.add(modules)

      const entries = getEntryInfo(chunk)
      if (entries.length > 0) {
        source.add(',\n')
        source.add(`"entries": ${JSON.stringify(entries)}\n`)
      }

      source.add(`};\n`)

      return source
    })
    chunkTemplate.hooks.hash.tap(PLUGIN_NAME, hash => {
      hash.update(PLUGIN_NAME)
      hash.update('3')
    })
    chunkTemplate.hooks.hashForChunk.tap(PLUGIN_NAME, (hash, chunk) => {
      hash.update(JSON.stringify(getEntryInfo(chunk)))
    })
  }
}
module.exports = ChunkTemplatePlugin
