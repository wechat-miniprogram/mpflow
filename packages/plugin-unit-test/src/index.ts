import { Plugin } from '@mpflow/service'
import path from 'path'

const plugin: Plugin = (api, config) => {
  api.registerCommand('test:unit', '执行单元测试', {}, {}, async args => {
    const jest = require('jest') as typeof import('jest')
    jest.run([], api.getCwd())
  })
}

plugin.generator = async api => {
  const pkg = require(path.resolve(__dirname, '../package.json'))
  api.extendPackage({
    scripts: {
      'test:unit': 'mpflow-service test:unit',
    },
    dependencies: {
      'miniprogram-simulate': pkg.devDependencies['miniprogram-simulate'],
      '@types/jest': pkg.devDependencies['@types/jest'],
    },
  })

  api.renderFile(path.resolve(__dirname, '../template/jest.config.js'), 'jest.config.js')

  api.processFile('src/**/components/*/*.{js,ts}', ({ path: filePath }) => {
    const name = path.basename(filePath, path.extname(filePath))
    api.renderFile(
      path.resolve(__dirname, '../template/comp.test.js'),
      path.resolve(filePath, `../__test__/${name}.test.js`),
      {
        additionalData: {
          name,
        },
      },
    )
  })
}

export default plugin
