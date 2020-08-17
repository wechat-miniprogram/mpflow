import cp from 'child_process'
import deepMerge from 'deepmerge'
import ejs, { Options as EjsOptions } from 'ejs'
import glob from 'fast-glob'
import type fs from 'fs'
import _mkdirp from 'mkdirp'
import path from 'path'
import semver from 'semver'
import { intersect } from 'semver-intersect'

type FileSystem = typeof fs

/**
 * 将某个目录下的文件读取
 */
export function loadFiles(fileSystem: FileSystem, source: string): Record<string, string> {
  const filePaths = glob.sync('**/*', { onlyFiles: true, cwd: source, ignore: ['node_modules/**'], fs: fileSystem })
  const files: Record<string, string> = {}

  for (const filePath of filePaths) {
    files[filePath] = fileSystem.readFileSync(path.resolve(source, filePath), 'utf-8')
  }

  return files
}

/**
 * 将某个目录下的文件渲染
 */
export function renderFiles(
  fileSystem: FileSystem,
  source: string,
  pattern: string,
  additionalData: Record<string, any> = {},
  ejsOptions: EjsOptions = {},
): Record<string, string> {
  const filePaths = glob.sync(pattern, { onlyFiles: true, cwd: source, fs: fileSystem })
  const files: Record<string, string> = {}

  for (const rawPath of filePaths) {
    const targetPath = rawPath
      .split('/')
      .map(filename => {
        // dotfiles are ignored when published to npm, therefore in templates
        // we need to use underscore instead (e.g. "_gitignore")
        if (filename.charAt(0) === '_' && filename.charAt(1) !== '_') {
          return `.${filename.slice(1)}`
        }
        if (filename.charAt(0) === '_' && filename.charAt(1) === '_') {
          return `${filename.slice(1)}`
        }
        return filename
      })
      .join('/')

    const sourcePath = path.resolve(source, rawPath)
    const content = renderFile(fileSystem, sourcePath, additionalData, ejsOptions)

    files[targetPath] = content
  }

  return files
}

/**
 * 渲染单个文件
 * @param sourcePath
 * @param additionalData
 * @param ejsOptions
 */
export function renderFile(
  fileSystem: FileSystem,
  sourcePath: string,
  additionalData: Record<string, any> = {},
  ejsOptions: EjsOptions = {},
): string {
  const template = fileSystem.readFileSync(sourcePath, 'utf-8')

  return ejs.render(template, additionalData, { ...ejsOptions, async: false })
}

/**
 * 创建文件夹
 */
export async function mkdirp(fileSystem: FileSystem, dirname: string): Promise<void> {
  return new Promise((resolve, reject) => _mkdirp(dirname, { fs: fileSystem }, err => (err ? reject(err) : resolve())))
}

/**
 * 写入文件
 */
export async function writeFile(fileSystem: FileSystem, filename: string, content: string): Promise<void> {
  await mkdirp(fileSystem, path.dirname(filename))
  await new Promise((resolve, reject) =>
    fileSystem.writeFile(filename, content, { encoding: 'utf8' }, err => (err ? reject(err) : resolve())),
  )
}

/**
 * 写入文件
 */
export async function writeFiles(
  fileSystem: FileSystem,
  context: string,
  files: Record<string, string>,
): Promise<void> {
  const names = Object.keys(files)
  for (const name of names) {
    const filePath = path.join(context, name)
    await writeFile(fileSystem, filePath, files[name])
  }
}

/**
 * 删除文件
 * @param context
 * @param files
 */
export async function removeFiles(fileSystem: FileSystem, context: string, files: Iterable<string>): Promise<void> {
  for (const name of files) {
    const filePath = path.join(context, name)
    await new Promise((resolve, reject) => fileSystem.unlink(filePath, err => (err ? reject(err) : resolve)))
  }
}

/**
 * 将虚拟文件树同步到文件系统
 * @param context
 * @param files
 */
export async function syncFiles(fileSystem: FileSystem, context: string, files: Record<string, string>): Promise<void> {
  const filePaths = glob.sync('**/*', { onlyFiles: true, cwd: context, ignore: ['node_modules/**'], fs: fileSystem })

  const filesToRemove = new Set(filePaths)
  Object.keys(files).forEach(file => filesToRemove.delete(file))

  await removeFiles(fileSystem, context, filesToRemove)
  await writeFiles(fileSystem, context, files)
}

/**
 * 执行命令
 */
export async function exec(context: string, command: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, { cwd: context, stdio: 'inherit' })
    child.on('close', code => {
      if (code) return reject(new Error(`exec exited with status ${code}`))
      resolve()
    })
  })
}

/**
 * 合并 package.json 中的 dependencies
 * @param id
 * @param sourceDeps
 * @param depsToInject
 * @param depSources
 */
export const mergeDeps = (
  id: string,
  sourceDeps: Record<string, string>,
  depsToInject: Record<string, string>,
  depSources: Record<string, string>,
): Record<string, string> => {
  const result = { ...sourceDeps }

  for (const depName in depsToInject) {
    const sourceRange = sourceDeps[depName]
    const injectingRange = depsToInject[depName]

    if (sourceRange === injectingRange) continue

    if (!semver.validRange(injectingRange)) {
      console.warn(`invalid semver "${depName}": "${injectingRange}" in ${id}`)
      continue
    }

    const sourceGeneratorId = depSources[depName]

    if (sourceRange) {
      if (!semver.intersects(sourceRange, injectingRange)) {
        console.warn(
          `semver "${depName}": "${sourceRange}"${
            sourceGeneratorId ? `(from ${sourceGeneratorId})` : ''
          } and "${depName}": "${injectingRange}"(from ${id}) are not intersect`,
        )
        continue
      }
      if (semver.subset(sourceRange, injectingRange)) continue
      result[depName] = intersect(sourceRange, injectingRange)
      depSources[depName] = id
    } else {
      result[depName] = injectingRange
      depSources[depName] = id
    }
  }

  return result
}

const mergeArrayWithDedupe = <A, B>(a: A[], b: B[]) => [...new Set([...a, ...b])]

/**
 * 合并 package.json
 */
export function mergePackage(
  target: Record<string, any>,
  toMerge: Record<string, any>,
  id: string,
  sourceDeps: Record<string, string>,
): void {
  for (const key in toMerge) {
    const existing = target[key]
    const value = toMerge[key]
    if (typeof value === 'object' && (key === 'dependencies' || key === 'devDependencies')) {
      // use special version resolution merge
      target[key] = mergeDeps(id, existing || {}, value, sourceDeps)
    } else if (!(key in target)) {
      target[key] = value
    } else if (Array.isArray(value) && Array.isArray(existing)) {
      target[key] = mergeArrayWithDedupe(existing, value)
    } else if (typeof value === 'object' && typeof existing === 'object') {
      target[key] = deepMerge(existing, value, { arrayMerge: mergeArrayWithDedupe })
    } else {
      target[key] = value
    }
  }
}

function sortObject(obj: Record<string, any>, keyOrder?: string[]): Record<string, any> {
  const res: Record<string, any> = {}

  if (keyOrder) {
    keyOrder.forEach(key => {
      if (key in obj) {
        res[key] = obj[key]
        delete obj[key]
      }
    })
  }

  const keys = Object.keys(obj).sort()

  keys.forEach(key => {
    res[key] = obj[key]
  })

  return res
}

/**
 * 生成 package.json
 */
export function stringifyPackage(pkg: Record<string, any>): string {
  if (pkg.dependencies) pkg.dependencies = sortObject(pkg.dependencies)
  if (pkg.devDependencies) pkg.devDependencies = sortObject(pkg.devDependencies)
  if (pkg.scripts) pkg.scripts = sortObject(pkg.scripts)

  pkg = sortObject(pkg, [
    'name',
    'version',
    'private',
    'description',
    'author',
    'scripts',
    'main',
    'module',
    'type',
    'browser',
    'files',
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ])

  return JSON.stringify(pkg, null, 2) + '\n'
}

/**
 * 获取路径下的本地 service
 * @param context
 */
export function getLocalService(context: string): typeof import('@mpflow/service') {
  try {
    return require(require.resolve('@mpflow/service', { paths: [context] }))
  } catch (e) {
    throw new Error(`无法在执行路径 "${context}" 下找到 @mpflow/service`)
  }
}

/**
 * 检测是否使用 yarn
 */
export function shouldUseYarn(): boolean {
  try {
    cp.execSync('yarnpkg --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

/**
 * 安装 node modules
 */
export function installNodeModules(
  context: string,
  modules?: string[],
  { saveDev }: { saveDev?: boolean } = {},
): Promise<void> {
  const useYarn = shouldUseYarn()
  const command = useYarn ? 'yarnpkg' : 'npm'
  const args: string[] = [useYarn && modules?.length ? 'add' : 'install', ...(modules || [])]

  if (saveDev) {
    args.push(useYarn ? '--dev' : '--save-dev')
  }

  return exec(context, command, args)
}

export function getPaths(path: string): string[] {
  const parts = path.split(/(.*?[\\/]+)/)
  const paths = [path]
  let part = parts[parts.length - 1]
  path = path.substr(0, path.length - part.length - 1)
  for (let i = parts.length - 2; i > 2; i -= 2) {
    paths.push(path)
    part = parts[i]
    path = path.substr(0, path.length - part.length) || '/'
  }
  part = parts[1]
  paths.push(part)
  return paths
}
