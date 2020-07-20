import ejs, { Options as EjsOptions } from 'ejs'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import util from 'util'

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
