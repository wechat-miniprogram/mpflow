import RuleSet from 'webpack/lib/RuleSet'

const PLUGIN_NAME = 'Weflow Loader Rules Plugin'

/**
 * LoaderRulesPlugin 将配置下发至 loader
 */
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
      compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, context => {
        context.__weflowRuleSets = ruleSets
      })
    })
  }
}

export default LoaderRulesPlugin
