import { Resolve, RuleSetRule, Compiler } from 'webpack'

export interface Options {
  resolve?: {
    sitemap?: Resolve
    page?: Resolve
    json?: Resolve
    javascript?: Resolve
    wxml?: Resolve
    wxss?: Resolve
  }
  rules?: {
    sitemap?: RuleSetRule[]
    page?: RuleSetRule[]
    json?: RuleSetRule[]
    javascript?: RuleSetRule[]
    wxml?: RuleSetRule[]
    wxss?: RuleSetRule[]
  }
}

declare class MpPlugin {
  constructor(options?: Options)
  apply(compiler: Compiler): void

  static target: (compiler: Compiler) => void

  static appLoader: string
  static pageLoader: string
}

export default MpPlugin
