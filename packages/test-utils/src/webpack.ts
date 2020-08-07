import { createFsFromVolume, Volume, IFs } from 'memfs'
import path from 'path'
import webpack, { Compiler, Configuration, Stats } from 'webpack'
import merge from 'webpack-merge'
import Module from 'module'
import glob from 'glob'
import fs from 'fs'

export function getCompiler(config: Configuration): Compiler {
  const fullConfig = merge(
    {
      mode: 'development',
      devtool: false,
      target: 'node',
      optimization: {
        minimize: false,
        namedModules: false,
      },
      output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].chunk.js',
        libraryTarget: 'commonjs2',
        pathinfo: false,
      },
    },
    config,
  )

  const compiler = webpack(fullConfig)

  const outputFileSystem = createFsFromVolume(new Volume())

  compiler.outputFileSystem = Object.assign(outputFileSystem, { join: path.join.bind(path) })

  return compiler
}

export function compile(compiler: Compiler): Promise<Stats> {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => (error ? reject(error) : resolve(stats)))
  })
}

function removeCWD(str: string): string {
  const isWin = process.platform === 'win32'
  let cwd = process.cwd()

  if (isWin) {
    str = str.replace(/\\/g, '/')
    cwd = cwd.replace(/\\/g, '/')
  }

  return str.replace(new RegExp(cwd, 'g'), '')
  // return str.replace(/\(from .*?\)/, '(from `replaced original path`)').replace(new RegExp(cwd, 'g'), '')
}

export function normalizeErrors(errors: Error[]): string[] {
  return errors.map(error => removeCWD(error.toString().split('\n').slice(0, 2).join('\n')))
}

export function getWarnings(stats: Stats): string[] {
  return normalizeErrors(stats.compilation.warnings)
}

export function getErrors(stats: Stats): string[] {
  return normalizeErrors(stats.compilation.errors)
}

export function getModuleSource(id: string, stats: Stats): string | undefined {
  const { modules } = stats.toJson({ source: true })
  const module = modules?.find(module => module.name.endsWith(id))
  return module?.source
}

export function execute<T>(code: string): T {
  const resource = 'test.js'
  const module = new Module(resource)
  // eslint-disable-next-line no-underscore-dangle
  // module.paths = Module._nodeModulePaths(
  //   path.resolve(__dirname, '../fixtures')
  // );
  module.filename = resource
  ;(module as any)._compile(code, resource)

  return module.exports
}

export function readAsset(asset: string, compiler: Compiler, stats: Stats): string {
  const outFs = (compiler.outputFileSystem as any) as IFs
  const outputPath: string = stats.compilation.outputOptions.path

  let data = ''
  let targetFile = asset

  const queryStringIdx = targetFile.indexOf('?')

  if (queryStringIdx >= 0) {
    targetFile = targetFile.substr(0, queryStringIdx)
  }

  try {
    data = outFs.readFileSync(path.join(outputPath, targetFile)).toString()
  } catch (error) {
    data = error.toString()
  }

  return data
}

export function readAssets(compiler: Compiler, stats: Stats): Record<string, string> {
  const assets: Record<string, string> = {}

  Object.keys(stats.compilation.assets).forEach(asset => {
    assets[asset] = readAsset(asset, compiler, stats)
  })

  return assets
}

export function getExecutedCode<T = any>(asset: string, compiler: Compiler, stats: Stats): T {
  return execute<T>(readAsset(asset, compiler, stats))
}

export async function expectAssetToMatchDir(assets: Record<string, string>, dirname: string): Promise<void> {
  const fileNameList = Object.keys(assets).sort()
  const realFileNameList = await new Promise<string[]>((resolve, reject) =>
    glob('**/*', { cwd: dirname, nodir: true }, (err, fileNameList) =>
      err ? reject(err) : resolve(fileNameList.sort()),
    ),
  )

  expect(fileNameList).toEqual(realFileNameList)

  for (const fileName of fileNameList) {
    const content = assets[fileName]
    const realContent = await new Promise<string>((resolve, reject) =>
      fs.readFile(path.join(dirname, fileName), 'utf8', (err, data) => (err ? reject(err) : resolve(data))),
    )

    expect(content).toEqual(realContent)
  }
}
