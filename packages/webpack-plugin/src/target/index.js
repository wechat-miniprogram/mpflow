import MiniprogramChunkFormatPlugin from './MiniprogramChunkFormatPlugin'

/** @typedef {import('webpack').Compiler} Compiler */
export default class MiniProgramTargetPlugin {
  /**
   * @param {Compiler} compiler
   */
  apply(compiler) {
    new MiniprogramChunkFormatPlugin().apply(compiler)
  }
}
