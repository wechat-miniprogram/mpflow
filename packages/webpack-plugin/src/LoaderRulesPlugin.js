import RuleSet from 'webpack/lib/RuleSet'

const PLUGIN_NAME = 'Mpflow Loader Rules Plugin'

/**
 * LoaderRulesPlugin 将配置下发至 loader
 */
class LoaderRulesPlugin {
  constructor(options = {}) {
    const { sitemap, page, json, javascript, wxml, wxss, icon } = {
      sitemap: [],
      page: [],
      json: [],
      javascript: [],
      wxml: [],
      wxss: [],
      icon: [],
      ...options,
    }

    this.ruleSets = {
      sitemap: new RuleSet(sitemap),
      page: new RuleSet(page),
      json: new RuleSet(json),
      javascript: new RuleSet(javascript),
      wxml: new RuleSet(wxml),
      wxss: new RuleSet(wxss),
      icon: new RuleSet(icon),
    }
  }

  apply(compiler) {
    const ruleSets = this.ruleSets
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, context => {
        context.__mpflowRuleSets = ruleSets
      })
    })
  }
}

export default LoaderRulesPlugin
