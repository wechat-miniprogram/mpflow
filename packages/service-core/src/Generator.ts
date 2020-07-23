import type { Options as EjsOptions } from 'ejs'
import type { BaseAPI, BaseService } from './Service'

export interface ProcessFileInfo {
  path: string
  source: string
}

export interface ProcessFileAPI {
  rename: (path: string) => void
  replace: (content: string) => void
}

export interface ProcessFileHandler {
  (fileInfo: ProcessFileInfo, api: ProcessFileAPI): void
}

export interface GeneratorAPI<T extends BaseService = BaseService> extends BaseAPI<T> {
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
