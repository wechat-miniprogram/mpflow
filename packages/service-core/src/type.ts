import { Configuration } from 'webpack'
import WebpackChain from 'webpack-chain'
import { GeneratorAPI } from './Generator'
import { RunnerAPI } from './Runner'

export interface MpflowConfig {
  /**
   * mpflow 要使用的插件列表
   */
  plugins?: (string | [string, Record<string, unknown>])[]
  /**
   * mpflow 打包调整 webpack 配置
   */
  configureWebpack?: Configuration | ((config: Configuration) => Configuration)
  /**
   * mpflow 打包调整 webpack 配置
   */
  configureWebpackChain?: (config: WebpackChain) => void
  /**
   * 项目的 APPID, 用于开发者工具预览以及上传
   */
  appId?: string
  /**
   * 项目编译类型, 默认为 miniprogram
   */
  compileType?: 'miniprogram' | 'plugin'
  /**
   * 指定小程序源码的目录(需为相对 sourceDir 的路径)
   */
  miniprogramRoot?: string
  /**
   * 指定腾讯云项目的目录(需为相对 sourceDir 的路径)
   */
  qcloudRoot?: string
  /**
   * 指定插件项目的目录(需为相对 sourceDir 的路径)
   */
  pluginRoot?: string
  /**
   * 打包输入目录, 默认为 src
   */
  sourceDir?: string
  /**
   * 打包输出目录, 默认为 dist
   */
  outputDir?: string
  /**
   * 打包 app 路径
   */
  app?: string | ((mode: string) => string)
  /**
   * 打包 plugin 路径
   */
  plugin?: string | ((mode: string) => string)
  /**
   * 打包 page 路径
   */
  pages?: string[] | ((mode: string) => string[])
  /**
   * project.config.json 中的 settings
   */
  settings?: any
}

export interface Plugin<Options = any> {
  (api: RunnerAPI, config: MpflowConfig, options: Options): void

  generator?: (api: GeneratorAPI, config: MpflowConfig, options: Options) => void

  postInstall?: (api: any, config: MpflowConfig) => Options | Promise<Options>
}
