import { Plugin } from '@mpflow/service-core'
import cp from 'child_process'
import fs from 'fs'
import { Compiler, Stats, MultiCompiler, compilation } from 'webpack'
import WebpackOutputFileSystem from '../utils/WebpackOutputFileSystem'

const getDevtoolCliPath = async () => {
  let cliPath: string
  if (process.platform === 'darwin') {
    cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
  } else if (process.platform === 'win32') {
    cliPath = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat'
  } else {
    // 其余平台暂不支持
    throw new Error('unsupported platform')
  }
  const exists = await new Promise<boolean>(resolve => fs.exists(cliPath, resolve))
  if (!exists) {
    // 找不到开发工具
    throw new Error(
      '未找到微信小程序开发者工具，请确认是否安装，如未安装请前往 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html 下载',
    )
  }
  return cliPath
}

const openDevtool = async (path: string) => {
  const cliPath = await getDevtoolCliPath()
  const child = cp.spawn(cliPath, ['open', '--project', path], {
    detached: true,
    stdio: 'inherit',
  })
  child.unref()
}

interface DevContext {
  compiler: MultiCompiler
  stats?: compilation.MultiStats
}

const printStats = (compiler: MultiCompiler, stats: compilation.MultiStats) => {
  process.stdout.write(stats.toString('minimal') + '\n\n')
}

const setupHooks = (context: DevContext, firstDone: () => void) => {
  let _firstDone = true

  const invalid = () => {
    context.stats = undefined
  }

  const done = (stats: compilation.MultiStats) => {
    context.stats = stats

    process.nextTick(() => {
      const { stats, compiler } = context
      if (!stats) return

      if (_firstDone) {
        _firstDone = false
        firstDone()
      }

      printStats(compiler, stats)
    })
  }

  const { compiler } = context

  compiler.hooks.watchRun.tap('miniprogram-dev', invalid)
  compiler.hooks.invalid.tap('miniprogram-dev', invalid)
  compiler.hooks.done.tap('miniprogram-dev', done)
}

const dev: Plugin = (api, config) => {
  api.registerCommand(
    'dev',
    '启动开发模式构建',
    {},
    {
      open: {
        boolean: true,
        description: '是否启动小程序开发工具',
      },
    },
    async args => {
      try {
        api.setMode('development')

        const { default: webpack } = await import('webpack')

        api.configureWebpack(({ configure }) => {
          configure(webpackConfig => {
            webpackConfig.watch(true)
          })
        })

        const webpackConfig = Object.values(await api.resolveWebpackConfigs())

        const compiler = webpack(webpackConfig)

        ;(compiler as any).outputFileSystem = new WebpackOutputFileSystem((api as any).service.outputFileSystem)

        const context: DevContext = {
          compiler,
        }

        setupHooks(context, () => {
          if (args.open) {
            openDevtool(api.resolve(config.outputDir || 'dist'))
          }
        })

        compiler.watch(
          {
            aggregateTimeout: 1000,
            poll: undefined,
          },
          err => {
            if (err) {
              console.error(err)
            }
          },
        )
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  )
}

dev.generator = (api, config) => {
  api.extendPackage({
    scripts: {
      dev: 'mpflow-service dev',
      'dev:open': 'mpflow-service dev --open',
    },
  })
}

export default dev
