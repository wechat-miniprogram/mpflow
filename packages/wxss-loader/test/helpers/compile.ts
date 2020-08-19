import { webpackTestUtils } from '@mpflow/test-utils'
import { Options } from '@mpflow/wxss-loader'
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
  const compiler = webpackTestUtils.getCompiler({
    context: path.resolve(__dirname, '../fixtures', fixture),
    entry: path.resolve(__dirname, '../fixtures', fixture, 'entry.js'),
    module: {
      rules: [
        {
          test: /\.wxss$/,
          loader: require.resolve('@mpflow/wxss-loader'),
          options: loaderOptions,
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
          loader: 'file-loader',
          options: { name: '[name].[hash:8].[ext]' },
        },
      ],
    },
    optimization: {
      namedModules: true,
    },
  })

  const stats = await webpackTestUtils.compile(compiler)
  const errors = webpackTestUtils.getErrors(stats)
  const warnings = webpackTestUtils.getWarnings(stats)
  const exports = webpackTestUtils.getExecutedCode('main.bundle.js', compiler, stats)

  return {
    stats,
    errors,
    warnings,
    exports,
  }
}
