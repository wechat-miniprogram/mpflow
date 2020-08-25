import { Plugin } from '@mpflow/service-core'
import path from 'path'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(({ configure }) => {
    configure(webpackConfig => {
      webpackConfig.module
        .rule('js')
        .test(/\.m?jsx?$/)
        .enforce('pre')
        .exclude.add(/node_modules/)
        .end()
        .use('babel-loader')
        .loader(require.resolve('babel-loader'))
        .options({
          cacheDirectory: true,
        })
    })
  })
}

plugin.generator = api => {
  const pkg = require('../package.json')

  api.extendPackage({
    dependencies: {
      'core-js': pkg.devDependencies['core-js'],
    },
  })

  api.renderDir(path.resolve(__dirname, '../template'))

  api.processFile('src/**/*.js', (file, api) => {
    api.transform(require('5to6-codemod/transforms/cjs'), {})
    api.transform(require('5to6-codemod/transforms/no-strict'), {})
    api.transform(require('5to6-codemod/transforms/exports'), {})
  })
}

export default plugin
