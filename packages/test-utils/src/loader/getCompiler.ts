import path from 'path'

import webpack, { Configuration, Compiler } from 'webpack'
import merge from 'webpack-merge'
import { createFsFromVolume, Volume } from 'memfs'

export default function getCompiler(config: Configuration): Compiler {
  const fullConfig = merge(
    {
      mode: 'development',
      devtool: false,
      target: 'node',
      optimization: {
        minimize: false,
      },
      output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js',
        libraryTarget: 'commonjs2',
      },
    },
    config,
  )

  const compiler = webpack(fullConfig)

  const outputFileSystem = createFsFromVolume(new Volume())

  compiler.outputFileSystem = Object.assign(outputFileSystem, { join: path.join.bind(path) })

  return compiler
}
