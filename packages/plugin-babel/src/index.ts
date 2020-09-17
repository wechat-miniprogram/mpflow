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
          configFile: api.resolve('babel.config.js'),
        })
    })
  })
}

plugin.generator = api => {
  const pkg = require('../package.json')

  api.extendPackage({
    devDependencies: {
      '@babel/runtime': pkg.devDependencies['@babel/runtime'],
    },
  })

  api.renderDir(path.resolve(__dirname, '../template'))
}

export default plugin
