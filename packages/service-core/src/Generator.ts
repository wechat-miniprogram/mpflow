import type { Options as EjsOptions } from 'ejs'
import type { BaseAPI, BaseService } from './Service'

export interface GeneratorAPI<T extends BaseService = BaseService> extends BaseAPI<T> {
  /**
   * 拓展 package.json
   * @param fields
   */
  extendPackage(fields: Record<string, any>): void

  /**
   * 将某个目录下的文件渲染
   */
  render(source: string, additionalData?: Record<string, any>, ejsOptions?: EjsOptions): Promise<void>
}
