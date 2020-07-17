import { Plugin, WeflowPluginConfigChain } from '@weflow/service'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(webpackConfig => {
    function addLoader(extension: string, loader?: string, options: any = {}) {
      if (loader) {
        webpackConfig.module
          .rule(extension)
          .test(new RegExp('\\.' + extension + '$'))
          .enforce('pre')
          .use(loader)
          .loader(require.resolve(loader))
          .options(options)
      }

      webpackConfig.plugin('weflow').tap(([weflowPluginConfig]: [WeflowPluginConfigChain]) => {
        weflowPluginConfig.resolve.wxss.extensions.add('.' + extension)

        return [weflowPluginConfig]
      })
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
