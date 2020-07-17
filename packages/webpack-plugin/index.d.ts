import { Compiler, Resolve, RuleSetRule } from 'webpack'
import { ChainedMap, Resolve as ResolveChain, Rule as RuleChain } from 'webpack-chain'

declare namespace WeflowPlugin {
  class ResolveConfigChain<T> extends ChainedMap<T> {
    sitemap: ResolveChain<ResolveConfigChain<T>>
    page: ResolveChain<ResolveConfigChain<T>>
    json: ResolveChain<ResolveConfigChain<T>>
    javascript: ResolveChain<ResolveConfigChain<T>>
    wxml: ResolveChain<ResolveConfigChain<T>>
    wxss: ResolveChain<ResolveConfigChain<T>>
  }

  class RulesConfigChain<T> extends ChainedMap<T> {
    sitemap(name: string): RuleChain<RulesConfigChain<T>>
    page(name: string): RuleChain<RulesConfigChain<T>>
    json(name: string): RuleChain<RulesConfigChain<T>>
    javascript(name: string): RuleChain<RulesConfigChain<T>>
    wxml(name: string): RuleChain<RulesConfigChain<T>>
    wxss(name: string): RuleChain<RulesConfigChain<T>>
  }

  export class ConfigChain extends ChainedMap<void> {
    resolve: ResolveConfigChain<ConfigChain>
    rules: RulesConfigChain<ConfigChain>

    toConfig(): Options
  }

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
}

declare class WeflowPlugin {
  constructor(options?: WeflowPlugin.Options)
  apply(compiler: Compiler): void

  static target: (compiler: Compiler) => void

  static appLoader: string
  static pageLoader: string

  // static ConfigChain: typeof WeflowPlugin.ConfigChain
}

export = WeflowPlugin
