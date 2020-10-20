import { Plugin } from '@mpflow/service'
import { ConfigChain } from '@mpflow/webpack-plugin'
import path from 'path'

const plugin: Plugin = (api, config) => {
  if (!api.hasPlugin('@mpflow/plugin-babel')) {
    throw new Error('@mpflow/plugin-typescript 需要安装 @mpflow/plugin-babel')
  }

  api.configureWebpack(({ configure }) => {
    configure(webpackConfig => {
      webpackConfig.resolve.extensions.prepend('.ts').prepend('.tsx')

      webpackConfig.resolve.plugin('tsconfig-paths').use(require('tsconfig-paths-webpack-plugin'), [{}])

      webpackConfig.module
        .rule('ts')
        .test(/\.tsx?$/)
        .pre()
        .exclude.add(/node_modules/)
        .end()
        .use('babel-loader')
        .loader(webpackConfig.module.rule('js').use('babel-loader').get('loader'))
        .options(webpackConfig.module.rule('js').use('babel-loader').get('options'))

      webpackConfig.plugin('fork-ts-checker').use(require('fork-ts-checker-webpack-plugin'), [{}])

      webpackConfig.plugin('mpflow').tap(([config]: [ConfigChain]) => {
        config.resolve.page.extensions.add('.ts').add('.tsx')

        config.resolve.javascript.extensions.add('.ts').add('.tsx')

        return [config]
      })
    })
  })
}

plugin.generator = async api => {
  const pkg = require('../package.json')
  api.extendPackage({
    devDependencies: {
      typescript: pkg.devDependencies.typescript,
      '@types/wechat-miniprogram': pkg.devDependencies['@types/wechat-miniprogram'],
    },
  })

  api.renderDir(path.resolve(__dirname, '../template'))

  api.processFile(['src/**/*.js', '!**/__test(s)?__/**'], (file, api) => {
    // js 文件重命名为 ts 文件
    api.rename(file.path.replace(/\.js$/, '.ts'))
  })

  if (api.hasPlugin('@mpflow/plugin-babel')) {
    api.processFile('babel.config.js', (file, api) => {
      api.transform(require('@mpflow/service-core/lib/codemods/add-exports-array').default, {
        fieldName: 'presets',
        items: ['@mpflow/plugin-typescript/preset'],
      })
    })
  }
}

export default plugin
