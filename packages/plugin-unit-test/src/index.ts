import { Plugin } from '@mpflow/service'
import path from 'path'

const plugin: Plugin = (api, config) => {
  if (!api.hasPlugin('@mpflow/plugin-babel')) {
    throw new Error('@mpflow/plugin-typescript 需要安装 @mpflow/plugin-babel')
  }

  api.registerCommand('test:unit', '执行单元测试', {}, {}, async args => {
    process.env.NODE_ENV = 'test'
    const jest = require('jest') as typeof import('jest')
    jest.run(['--config', api.resolve('jest.unit.config.js'), ...args._.slice(1)].map(String), api.getCwd())
  })
}

plugin.generator = async api => {
  const pkg = require(path.resolve(__dirname, '../package.json'))
  api.extendPackage({
    scripts: {
      'test:unit': 'mpflow-service test:unit',
    },
    devDependencies: {
      '@types/jest': pkg.devDependencies['@types/jest'],
      'miniprogram-simulate': pkg.devDependencies['miniprogram-simulate'],
    },
  })

  api.renderFile(path.resolve(__dirname, '../template/jest.unit.config.js'), 'jest.unit.config.js')

  api.processFile('src/**/components/*/*.{js,ts}', ({ path: filePath }) => {
    const name = path.basename(filePath, path.extname(filePath))
    api.renderFile(
      path.resolve(__dirname, '../template/comp.test.js'),
      path.join(filePath, `../__test__/${name}.test.js`),
      {
        additionalData: {
          name,
        },
      },
    )
  })
}

export default plugin
