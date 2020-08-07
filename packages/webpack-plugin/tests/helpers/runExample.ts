import { loaderTestUtils } from '@weflow/test-utils'
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
  const compiler = loaderTestUtils.getCompiler(exampleConfig)

  const stats = await loaderTestUtils.compile(compiler)
  const errors = loaderTestUtils.getErrors(stats)
  const warnings = loaderTestUtils.getWarnings(stats)
  const assets = loaderTestUtils.readAssets(compiler, stats)

  return {
    stats,
    errors,
    warnings,
    assets,
  }
}
