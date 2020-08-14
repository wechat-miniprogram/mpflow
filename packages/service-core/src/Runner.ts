import type { Configuration } from 'webpack'
import type WebpackChain from 'webpack-chain'
import type { Arguments, Argv, CommandModule, InferredOptionTypes, Options, PositionalOptions } from 'yargs'
import yargs from 'yargs/yargs'
import { BaseAPI, BaseService, BaseServiceOptions } from './Service'
import { Plugin } from './type'

export abstract class BaseRunnerAPI<P = Plugin, S extends Runner<P> = Runner<P>> extends BaseAPI<P, S> {
  /**
   * 注册 CLI 命令
   * @param command
   * @param describe
   * @param positional
   * @param options
   * @param handler
   */
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
    this.service.registerCommand(command, describe, positional, options, handler)
  }
}

export abstract class RunnerAPI<P = Plugin, S extends Runner<P> = Runner<P>> extends BaseRunnerAPI<P, S> {
  mode: string

  abstract beforeConfigureWebpack(handler: () => void): void

  abstract addWebpackConfig(id: string, config: (config: WebpackChain, id: string) => void): boolean

  abstract configureWebpack(id: string, config: (config: WebpackChain, id: string) => void): void
  abstract configureWebpack(config: (config: WebpackChain, id: string) => void): void

  abstract resolveWebpackConfigs(): Promise<Configuration[]>

  abstract hasWebpackConfig(id: string): boolean
}

export interface RunnerOptions extends BaseServiceOptions {}

export abstract class Runner<P = Plugin> extends BaseService<P> {
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

  /**
   * 注册 CLI 命令
   * @param command
   * @param describe
   * @param positional
   * @param options
   * @param handler
   */
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
    this.program.command({
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
