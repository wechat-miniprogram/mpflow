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

export interface ConfigureWebpackAPI {
  addConfig(id: string, config: (config: WebpackChain) => void): boolean

  configure(id: string, config: (config: WebpackChain, id: string) => void): void
  configure(config: (config: WebpackChain, id: string) => void): void

  hasConfig(id: string): boolean
}

export interface ConfigureWebpackHandler {
  (api: ConfigureWebpackAPI, mode: string): void
}

export abstract class RunnerAPI<P = Plugin, S extends Runner<P> = Runner<P>> extends BaseRunnerAPI<P, S> {
  abstract setMode(mode: string): void
  abstract getMode(): string

  abstract configureWebpack(handler: ConfigureWebpackHandler): void

  abstract resolveWebpackConfigs(): Promise<Record<string, Configuration>>
}

export interface RunnerOptions extends BaseServiceOptions {}

export abstract class Runner<P = Plugin> extends BaseService<P> {
  /**
   * CLI 操作对象
   */
  public program: Argv

  /**
   * 正在执行的 cli 命令的 promise 实例
   */
  private _commandPromise: Promise<void> | null = null

  constructor(context: string, options: RunnerOptions = {}) {
    super(context, options)

    this.program = yargs()
  }

  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    this.program.help().demandCommand().parse(argv)

    if (this._commandPromise) await this._commandPromise
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
        this._commandPromise = (async () => {
          try {
            await handler(args as any)
          } catch (e) {
            console.error(e)
            process.exit(1)
          }
        })()
      },
      builder: yargs => {
        Object.keys(positional).forEach(key => (yargs = yargs.positional(key, positional[key])))
        yargs = yargs.options(options)
        return yargs
      },
    })
  }
}
