import { Plugin } from '@mpflow/service'
import path from 'path'

const plugin: Plugin = (api, config) => {
  if (!api.hasPlugin('@mpflow/plugin-babel')) {
    throw new Error('@mpflow/plugin-typescript 需要安装 @mpflow/plugin-babel')
  }

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

      const babelPluginIstanbul = require.resolve('babel-plugin-istanbul')

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
                  const plugins: (string | [string, any])[] = (options.plugins = options.plugins || [])

                  const index = plugins.findIndex(
                    plugin => plugin === babelPluginIstanbul || plugin[0] === babelPluginIstanbul,
                  )

                  if (index > -1) {
                    plugins[index] = [
                      babelPluginIstanbul,
                      {
                        ...(plugins[index][1] || {}),
                        coverageGlobalScopeFunc: false,
                        coverageGlobalScope: 'globalThis',
                      },
                    ]
                  } else {
                    plugins.push([
                      babelPluginIstanbul,
                      {
                        coverageGlobalScopeFunc: false,
                        coverageGlobalScope: 'globalThis',
                      },
                    ])
                  }
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
        ].map(String),
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
    devDependencies: {
      '@types/jest': pkg.devDependencies['@types/jest'],
    },
  })

  api.renderDir(path.resolve(__dirname, '../template'))
}

export default plugin
