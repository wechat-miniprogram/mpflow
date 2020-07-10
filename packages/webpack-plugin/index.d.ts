import { Resolve } from 'webpack'

export interface Options {
  resolve?: {
    sitemap?: Resolve
    page?: Resolve
    json?: Resolve
    javascript?: Resolve
    wxml?: Resolve
    wxss?: Resolve
  }
}

declare class MpPlugin {
  constructor(options?: Options)
  apply(compiler: any): void

  static target: (compiler: any) => void

  static appLoader: string
  static pageLoader: string
  static externalLoader: string
  static assetLoader: string
}

export default MpPlugin
