import RuleSet from 'webpack/lib/RuleSet'
import { cachedCleverMerge } from 'webpack/lib/util/cachedMerge'

const PLUGIN_NAME = 'Weflow Loader Rules Plugin'

class LoaderRulesPlugin {
  constructor(options = {}) {
    const { sitemap, page, json, javascript, wxml, wxss } = {
      sitemap: [],
      page: [],
      json: [],
      javascript: [],
      wxml: [],
      wxss: [],
      ...options,
    }

    this.ruleSets = {
      sitemap: new RuleSet(sitemap),
      page: new RuleSet(page),
      json: new RuleSet(json),
      javascript: new RuleSet(javascript),
      wxml: new RuleSet(wxml),
      wxss: new RuleSet(wxss),
    }
  }

  apply(compiler) {
    const ruleSets = this.ruleSets
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, (context, module) => {
        const resource = module.resource

        if (!resource) return

        const queryIndex = resource.indexOf('?')
        const resourceQuery = queryIndex >= 0 ? resource.substr(queryIndex) : ''
        const resourcePath = queryIndex >= 0 ? resource.substr(0, queryIndex) : resource

        const weflowLoaders = {}

        Object.keys(ruleSets).forEach(type => {
          const result = ruleSets[type].exec({
            resource: resourcePath,
            realResource: resourcePath,
            resourceQuery,
            issuer: module.issuer,
            compiler,
          })

          const settings = {}
          const useLoadersPost = []
          const useLoaders = []
          const useLoadersPre = []

          for (const r of result) {
            if (r.type === 'use') {
              if (r.enforce === 'post') {
                useLoadersPost.push(r.value)
              } else if (r.enforce === 'pre') {
                useLoadersPre.push(r.value)
              } else if (!r.enforce) {
                useLoaders.push(r.value)
              }
            } else if (
              typeof r.value === 'object' &&
              r.value !== null &&
              typeof settings[r.type] === 'object' &&
              settings[r.type] !== null
            ) {
              settings[r.type] = cachedCleverMerge(settings[r.type], r.value)
            } else {
              settings[r.type] = r.value
            }
          }

          const loaders = useLoadersPost.concat(useLoaders, useLoadersPre)

          weflowLoaders[type] = loaders
        })

        context.__weflowLoaders = weflowLoaders
      })
    })
  }
}

export default LoaderRulesPlugin
