import path from 'path'
import { Configuration } from 'webpack'
import WebpackChain from 'webpack-chain'
import { Arguments, CommandModule, InferredOptionTypes, Options } from 'yargs'
import Service, { WeflowConfig } from './Service'

export interface Plugin {
  (api: PluginAPI, config: WeflowConfig): void

  generator?: <C>(api: any, config: C) => void
}

export class BaseAPI<T> {
  public id: string
  protected service: Service
  protected shared: Partial<T>

  constructor(id: string, service: Service, shared: Partial<T> = {}) {
    this.id = id
    this.service = service
    this.shared = shared
  }

  get mode(): string {
    return this.service.mode
  }

  set mode(mode: string) {
    this.service.mode = mode
  }

  getCwd(): string {
    return this.service.context
  }

  resolve(_path: string): string {
    return path.resolve(this.service.context, _path)
  }

  hasPlugin(id: string): boolean {
    return this.service.plugins.some(p => p.id === id)
  }
}

export class PluginAPI extends BaseAPI<unknown> {
  registerCommand<T = Record<string, unknown>, O extends Record<string, Options> = Record<string, Options>>(
    command: CommandModule['command'],
    describe: CommandModule['describe'],
    options: O,
    handler: (args: Arguments<Omit<T, keyof O> & InferredOptionTypes<O>>) => void,
  ): void {
    this.service.registerCommand({
      command,
      describe,
      handler,
      builder: yargs => yargs.options(options),
    })
  }

  configureWebpack(config: (config: WebpackChain) => void): void {
    this.service.webpackConfigs.push(config)
  }

  resolveWebpackConfig(): Configuration {
    return this.service.resolveWebpackConfig()
  }
}
