import type { Options as EjsOptions } from 'ejs'
import type { Transform } from 'jscodeshift'
import type { BaseAPI, BaseService } from './Service'
import type { Plugin } from './type'

export interface ProcessFileInfo {
  path: string
  source: string
}

export interface ProcessFileAPI {
  rename: (path: string) => void
  replace: (content: string) => void
  transform: (transform: Transform, options?: any) => void
}

export interface ProcessFileHandler {
  (fileInfo: ProcessFileInfo, api: ProcessFileAPI): void
}

export interface GeneratorAPI<P = Plugin, S extends BaseService<P> = BaseService<P>> extends BaseAPI<P, S> {
  /**
   * 拓展 package.json
   * @param fields
   */
  extendPackage(fields: Record<string, any>): void

  /**
   * 将某个目录下的文件渲染
   */
  render(source: string, additionalData?: Record<string, any>, ejsOptions?: EjsOptions): void

  /**
   * 处理文件
   */
  processFile(filter: string, handler: ProcessFileHandler): void
  processFile(handler: ProcessFileHandler): void
}
