import ejs, { Options as EjsOptions } from 'ejs'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import util from 'util'
import cp from 'child_process'

const globPromise = util.promisify(glob)

/**
 * 将某个目录下的文件渲染
 */
export async function renderFiles(
  source: string,
  additionalData: Record<string, any> = {},
  ejsOptions: EjsOptions = {},
): Promise<Record<string, string>> {
  const filePaths = await globPromise('**/*', { nodir: true, cwd: source })
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
    const content = await renderFile(sourcePath, additionalData, ejsOptions)

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
export async function renderFile(
  sourcePath: string,
  additionalData: Record<string, any> = {},
  ejsOptions: EjsOptions = {},
): Promise<string> {
  const template = await fs.readFile(sourcePath, 'utf-8')

  return ejs.render(template, additionalData, ejsOptions)
}

/**
 * 写入文件
 */
export async function writeFiles(context: string, files: Record<string, string>): Promise<void> {
  const names = Object.keys(files)
  for (const name of names) {
    const filePath = path.join(context, name)
    await fs.mkdirp(path.dirname(filePath))
    await fs.writeFile(filePath, files[name])
  }
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
