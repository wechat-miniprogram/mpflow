import { Plugin } from '@mpflow/service'
import path from 'path'
// import type Automator from 'miniprogram-automator'

// type PromiseResult<P extends Promise<any>> = P extends Promise<infer R> ? R : never

// declare global {
//   const miniProgram: PromiseResult<ReturnType<typeof Automator.connect>>
// }

const plugin: Plugin = (api, config) => {
  api.registerCommand(
    'test:e2e',
    '执行集成测试',
    {},
    {
      coverage: {
        type: 'boolean',
        describe: '收集代码覆盖率信息',
        default: false,
      },
    },
    async args => {
      process.env.NODE_ENV = 'test'

      const { coverage } = args

      if (coverage) {
        // 添加 babel-plugin-istanbul
        api.configureWebpack(({ configure }) => {
          configure(webpackConfig => {
            function modifyBabelLoaderOptions(ruleName: string, loaderName: string) {
              webpackConfig.module
                .rule(ruleName)
                .use(loaderName)
                .tap(options => {
                  const plugins = (options.plugins = options.plugins || [])
                  plugins.push([
                    require.resolve('babel-plugin-istanbul'),
                    {
                      coverageGlobalScopeFunc: false,
                      coverageGlobalScope: 'globalThis',
                    },
                  ])
                  return options
                })
            }

            modifyBabelLoaderOptions('js', 'babel-loader')
            if (api.hasPlugin('@mpflow/plugin-typescript')) modifyBabelLoaderOptions('ts', 'babel-loader')
          })
        })
      }

      // 执行一遍构建
      await api.runCommand(['build', '--dev'])

      // 触发 jest 测试
      const jest = require('jest') as typeof import('jest')
      jest.run(
        [
          '--config',
          api.resolve('jest.e2e.config.js'),
          coverage ? '--coverage' : '',
          '--test-environment-options',
          JSON.stringify({ projectPath: api.resolve(config.outputDir || 'dist') }),
          ...args._.slice(1),
        ],
        api.getCwd(),
      )
    },
  )
}

plugin.generator = async api => {
  const pkg = require(path.resolve(__dirname, '../package.json'))
  api.extendPackage({
    scripts: {
      'test:e2e': 'mpflow-service test:e2e',
    },
    dependencies: {
      '@types/jest': pkg.devDependencies['@types/jest'],
    },
  })

  api.renderDir(path.resolve(__dirname, '../template'))
}

export default plugin
