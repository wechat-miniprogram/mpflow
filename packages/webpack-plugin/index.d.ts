import { Compiler, Resolve, RuleSetRule } from 'webpack'
import { ChainedMap, Resolve as ResolveChain, Rule as RuleChain, TypedChainedSet } from 'webpack-chain'

declare namespace MpflowPlugin {
  class ResolveConfigChain<T> extends ChainedMap<T> {
    roots: TypedChainedSet<this, string>

    sitemap: ResolveChain<ResolveConfigChain<T>>
    page: ResolveChain<ResolveConfigChain<T>>
    json: ResolveChain<ResolveConfigChain<T>>
    javascript: ResolveChain<ResolveConfigChain<T>>
    wxml: ResolveChain<ResolveConfigChain<T>>
    wxss: ResolveChain<ResolveConfigChain<T>>
    icon: ResolveChain<ResolveConfigChain<T>>
  }

  class RulesConfigChain<T> extends ChainedMap<T> {
    sitemap(name: string): RuleChain<RulesConfigChain<T>>
    page(name: string): RuleChain<RulesConfigChain<T>>
    json(name: string): RuleChain<RulesConfigChain<T>>
    javascript(name: string): RuleChain<RulesConfigChain<T>>
    wxml(name: string): RuleChain<RulesConfigChain<T>>
    wxss(name: string): RuleChain<RulesConfigChain<T>>
    icon(name: string): RuleChain<RulesConfigChain<T>>
  }

  class ProgramConfigChain<T> extends ChainedMap<T> {
    appId(value: string | undefined): this
    outputPath(value: string | undefined): this
    projectName(value: string | undefined): this
    compileType(value: string | undefined): this
    miniprogramRoot(value: string | undefined): this
    qcloudRoot(value: string | undefined): this
    pluginRoot(value: string | undefined): this
    settings(value: any): this
    useExtendedLib(value: any): this
  }

  export class ConfigChain extends ChainedMap<void> {
    resolve: ResolveConfigChain<ConfigChain>
    rules: RulesConfigChain<ConfigChain>
    program: ProgramConfigChain<ConfigChain>

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
    program?: {
      appId?: string
      outputPath?: string
      projectName?: string
      compileType?: string
      miniprogramRoot?: string
      qcloudRoot?: string
      pluginRoot?: string
      settings?: any
      useExtendedLib?: {
        weui?: boolean
      }
    }
  }
}

declare class MpflowPlugin {
  constructor(options?: MpflowPlugin.Options)
  apply(compiler: Compiler): void

  static target: (compiler: Compiler) => void

  static appLoader: string
  static pageLoader: string
  static pluginLoader: string
  static libLoader: string

  // static ConfigChain: typeof MpflowPlugin.ConfigChain
}

export = MpflowPlugin
