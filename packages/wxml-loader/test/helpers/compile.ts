import { loaderTestUtils } from '@mpflow/test-utils'
import { Options } from '@mpflow/wxml-loader'
import { Stats } from 'webpack'
import path from 'path'

export default async function compile(
  fixture: string,
  loaderOptions: Options,
): Promise<{
  stats: Stats
  errors: string[]
  warnings: string[]
  exports: any
}> {
  const compiler = loaderTestUtils.getCompiler({
    context: path.resolve(__dirname, '../fixtures', fixture),
    entry: path.resolve(__dirname, '../fixtures', fixture, 'entry.js'),
    module: {
      rules: [
        {
          test: /\.wxml$/,
          loader: require.resolve('@mpflow/wxml-loader'),
          options: loaderOptions,
        },
        {
          test: /\.wxs$/,
          loader: 'raw-loader',
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
          loader: 'file-loader',
          options: { name: '[name].[hash:8].[ext]' },
        },
      ],
    },
  })

  const stats = await loaderTestUtils.compile(compiler)
  const errors = loaderTestUtils.getErrors(stats)
  const warnings = loaderTestUtils.getWarnings(stats)
  const exports = loaderTestUtils.getExecutedCode('main.bundle.js', compiler, stats)

  return {
    stats,
    errors,
    warnings,
    exports,
  }
}
