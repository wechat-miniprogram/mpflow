import { Configuration } from 'webpack'
import WebpackChain from 'webpack-chain'
import { GeneratorAPI } from './Generator'
import { RunnerAPI } from './Runner'

export interface WeflowConfig {
  plugins?: string[]
  configureWebpack?: Configuration | ((config: Configuration) => Configuration)
  configureWebpackChain?: (config: WebpackChain) => void
  outputDir?: string
  app?: string
  plugin?: string
  pages?: string[]
}

export interface Plugin {
  (api: RunnerAPI, config: WeflowConfig): void

  generator?: (api: GeneratorAPI, config: WeflowConfig) => void
}
