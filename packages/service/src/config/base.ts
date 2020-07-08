import WeflowPlugin from '@weflow/webpack-plugin'
import path from 'path'
import { Plugin } from '../PluginAPI'

const base: Plugin = (api, config) => {
  api.configureWebpack({
    entry: {
      ...(config.app !== false
        ? {
            app: `${WeflowPlugin.appLoader}!${api.resolve(
              typeof config.app === 'string' ? config.app : 'src/app',
            )}`,
          }
        : {}),
      ...(config.pages
        ? config.pages
            .map(pagePath => {
              const basename = path.basename(pagePath, path.extname(pagePath))
              return [basename, `${WeflowPlugin.pageLoader}!${api.resolve(pagePath)}`]
            })
            .reduce((entry, [key, val]) => ({ ...entry, [key]: val }))
        : {}),
    },

    context: api.getCwd(),

    output: {
      path: api.resolve(config.outputDir || 'dist'),
    },

    module: {
      rules: [
        {
          test: /\.json$/,
          type: 'javascript/auto',
          use: require.resolve('json-loader'),
        },
        {
          test: /\.wxml$/,
          use: require.resolve('@weflow/wxml-loader'),
        },
        {
          test: /\.wxss$/,
          use: require.resolve('@weflow/wxss-loader'),
        },
      ],
    },

    target: WeflowPlugin.target,

    plugins: [new WeflowPlugin({})],
  })
}

export default base
