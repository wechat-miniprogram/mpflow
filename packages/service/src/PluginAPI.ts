import path from 'path'
import { Arguments, CommandModule, InferredOptionTypes, Options } from 'yargs'
import Service, { WeflowConfig } from './Service'
import { Configuration } from 'webpack'

export interface Plugin {
  (api: PluginAPI, config: WeflowConfig): void
}

export class PluginAPI {
  public id: string
  public service: Service

  constructor(id: string, service: Service) {
    this.id = id
    this.service = service
  }

  getCwd() {
    return this.service.context
  }

  resolve(_path: string) {
    return path.resolve(this.service.context, _path)
  }

  registerCommand<T = {}, O extends { [key: string]: Options } = {}, U = {}>(
    command: CommandModule['command'],
    describe: CommandModule['describe'],
    options: O,
    handler: (args: Arguments<Omit<T, keyof O> & InferredOptionTypes<O>>) => void,
  ) {
    this.service.registerCommand({
      command,
      describe,
      handler,
      builder: yargs => yargs.options(options),
    })
  }

  configureWebpack(config: Configuration) {
    this.service.webpackConfigs.push(config)
  }

  resolveWebpackConfig() {
    return this.service.resolveWebpackConfig()
  }
}
