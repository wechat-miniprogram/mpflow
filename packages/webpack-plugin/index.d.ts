import { Compiler, Resolve, RuleSetRule } from 'webpack'
import Config, {
  ChainedMap,
  Resolve as ResolveChain,
  Rule as RuleChain,
  TypedChainedSet,
  TypedChainedMap,
} from 'webpack-chain'

declare namespace WeflowPlugin {
  class ResolveConfigChain<T> extends ChainedMap<T> {
    roots: TypedChainedSet<this, string>

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

  class TemplatesConfigChain<T> extends ChainedMap<T> {
    template(value: string): this
    to(value: string): this
    data(value: any): this
  }

  export class ConfigChain extends ChainedMap<void> {
    resolve: ResolveConfigChain<ConfigChain>
    rules: RulesConfigChain<ConfigChain>
    templates: TypedChainedMap<this, TemplatesConfigChain<ConfigChain>>

    template(name: string): TemplatesConfigChain<ConfigChain>

    toConfig(): Options
  }

  export interface Options {
    resolve?: {
      roots?: string[]
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
    templates?: {
      /**
       * ejs 模板路径
       */
      template?: string
      /**
       * 模板输出路径
       */
      to?: string
      /**
       * 模板 ejs 渲染数据
       */
      data?: any
    }[]
  }
}

declare class WeflowPlugin {
  constructor(options?: WeflowPlugin.Options)
  apply(compiler: Compiler): void

  static target: (compiler: Compiler) => void

  static appLoader: string
  static pageLoader: string
  static pluginLoader: string

  // static ConfigChain: typeof WeflowPlugin.ConfigChain
}

export = WeflowPlugin
