import type { Configuration } from 'webpack'
import type WebpackChain from 'webpack-chain'
import type { Arguments, Argv, CommandModule, InferredOptionTypes, Options, PositionalOptions } from 'yargs'
import yargs from 'yargs/yargs'
import { BaseAPI, BaseService, BaseServiceOptions } from './Service'

export abstract class BaseRunnerAPI<T extends Runner = Runner> extends BaseAPI<T> {
  registerCommand<
    P extends Record<string, PositionalOptions> = Record<string, PositionalOptions>,
    O extends Record<string, Options> = Record<string, Options>
  >(
    command: CommandModule['command'],
    describe: CommandModule['describe'],
    positional: P,
    options: O,
    handler: (args: Arguments<InferredOptionTypes<P> & InferredOptionTypes<O>>) => void,
  ): void {
    this.service.program.command({
      command,
      describe,
      handler: args => {
        handler(args as any)
      },
      builder: yargs => {
        Object.keys(positional).forEach(key => (yargs = yargs.positional(key, positional[key])))
        yargs = yargs.options(options)
        return yargs
      },
    })
  }
}

export abstract class RunnerAPI<T extends Runner = Runner> extends BaseRunnerAPI<T> {
  mode: string

  abstract beforeConfigureWebpack(handler: () => void): void

  abstract addWebpackConfig(id: string, config: (config: WebpackChain, id: string) => void): boolean

  abstract configureWebpack(id: string, config: (config: WebpackChain, id: string) => void): void
  abstract configureWebpack(config: (config: WebpackChain, id: string) => void): void

  abstract resolveWebpackConfigs(): Promise<Configuration[]>

  abstract hasWebpackConfig(id: string): boolean
}

export interface RunnerOptions extends BaseServiceOptions {}

export class Runner extends BaseService {
  /**
   * CLI 操作对象
   */
  public program: Argv

  constructor(context: string, options: RunnerOptions = {}) {
    super(context, options)

    this.program = yargs()
  }

  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    this.program.help().demandCommand().parse(argv)
  }
}
