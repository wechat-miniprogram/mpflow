import type { Configuration } from 'webpack'
import type WebpackChain from 'webpack-chain'
import type { Arguments, CommandModule, InferredOptionTypes, Options } from 'yargs'
import type { BaseAPI, BaseService } from './Service'

export interface RunnerAPI<T extends BaseService = BaseService> extends BaseAPI<T> {
  mode: string

  registerCommand<O extends Record<string, Options> = Record<string, Options>>(
    command: CommandModule['command'],
    describe: CommandModule['describe'],
    options: O,
    handler: (args: Arguments<InferredOptionTypes<O>>) => void,
  ): void

  configureWebpack(config: (config: WebpackChain) => void): void

  resolveWebpackConfig(): Configuration
}
