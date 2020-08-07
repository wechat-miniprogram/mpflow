import { webpackTestUtils } from '@mpflow/test-utils'
import path from 'path'
import { Stats } from 'webpack'

export default async function runExample(
  example: string,
): Promise<{
  stats: Stats
  errors: string[]
  warnings: string[]
  assets: Record<string, string>
}> {
  const exampleConfig = require(path.resolve(__dirname, '../../examples', example, 'webpack.config.js'))
  const compiler = webpackTestUtils.getCompiler(exampleConfig)

  const stats = await webpackTestUtils.compile(compiler)
  const errors = webpackTestUtils.getErrors(stats)
  const warnings = webpackTestUtils.getWarnings(stats)
  const assets = webpackTestUtils.readAssets(compiler, stats)

  return {
    stats,
    errors,
    warnings,
    assets,
  }
}
