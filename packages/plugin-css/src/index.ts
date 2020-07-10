import { Plugin } from '@weflow/service'
import { Options } from '@weflow/webpack-plugin'
import deepmerge from 'deepmerge'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    function addLoader(extension: string, loader?: string, options: any = {}) {
      const loaderRule = webpackConfig.module
        .rule(extension)
        .test(new RegExp('\\.' + extension + '$'))
        .use('wxss')
        .loader(require.resolve('@weflow/wxss-loader'))
        .end()
      if (loader) {
        loaderRule.use(loader).loader(require.resolve(loader)).options(options)
      }

      webpackConfig.plugin('weflow').tap((options: Options[]) =>
        options.map(option =>
          deepmerge<Options, Options>(option, {
            resolve: {
              wxss: {
                extensions: ['.' + extension],
              },
            },
          }),
        ),
      )
    }

    addLoader('css')
    addLoader('less', 'less-loader')
    addLoader('sass', 'sass-loader', { indentedSyntax: true })
    addLoader('scss', 'sass-loader')
    addLoader('stylus', 'stylus-loader')
    addLoader('styl', 'stylus-loader')
  })
}

export default plugin
