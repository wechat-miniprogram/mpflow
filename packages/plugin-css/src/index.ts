import { Plugin } from '@mpflow/service'
import { ConfigChain } from '@mpflow/webpack-plugin'

const plugin: Plugin = (api, config) => {
  api.configureWebpack(({ configure }) => {
    configure(webpackConfig => {
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

        webpackConfig.plugin('mpflow').tap(([mpflowPluginConfig]: [ConfigChain]) => {
          mpflowPluginConfig.resolve.wxss.extensions.add('.' + extension)

          return [mpflowPluginConfig]
        })
      }

      addLoader('css')
      addLoader('less', 'less-loader')
      addLoader('sass', 'sass-loader', { indentedSyntax: true })
      addLoader('scss', 'sass-loader')
      addLoader('stylus', 'stylus-loader')
      addLoader('styl', 'stylus-loader')
    })
  })
}

plugin.generator = api => {
  api.processFile('src/**/*.wxss', (file, api) => {
    // wxss 文件重命名为 less 文件
    api.rename(file.path.replace(/\.wxss$/, '.less'))
  })
}

export default plugin
