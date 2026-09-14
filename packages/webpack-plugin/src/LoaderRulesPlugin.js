import NormalModule from 'webpack/lib/NormalModule'
import RuleSetCompiler from 'webpack/lib/rules/RuleSetCompiler'
import BasicMatcherRulePlugin from 'webpack/lib/rules/BasicMatcherRulePlugin'
import BasicEffectRulePlugin from 'webpack/lib/rules/BasicEffectRulePlugin'
import ObjectMatcherRulePlugin from 'webpack/lib/rules/ObjectMatcherRulePlugin'
import UseEffectRulePlugin from 'webpack/lib/rules/UseEffectRulePlugin'

const ruleSetCompiler = new RuleSetCompiler([
  new BasicMatcherRulePlugin('test', 'resource'),
  new BasicMatcherRulePlugin('include', 'resource'),
  new BasicMatcherRulePlugin('exclude', 'resource', true),
  ...[
    'resource',
    'resourceQuery',
    'resourceFragment',
    'realResource',
    'issuer',
    'compiler',
    'dependency',
    'scheme',
    'mimetype',
    'issuerLayer',
  ].map(key => new BasicMatcherRulePlugin(key)),
  new ObjectMatcherRulePlugin('descriptionData'),
  ...['type', 'sideEffects', 'parser', 'resolve', 'generator', 'layer'].map(key => new BasicEffectRulePlugin(key)),
  new UseEffectRulePlugin(),
])

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
      sitemap: ruleSetCompiler.compile(sitemap),
      page: ruleSetCompiler.compile(page),
      json: ruleSetCompiler.compile(json),
      javascript: ruleSetCompiler.compile(javascript),
      wxml: ruleSetCompiler.compile(wxml),
      wxss: ruleSetCompiler.compile(wxss),
      icon: ruleSetCompiler.compile(icon),
    }
  }

  apply(compiler) {
    const ruleSets = this.ruleSets
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      NormalModule.getCompilationHooks(compilation).loader.tap(PLUGIN_NAME, context => {
        context.__mpflowRuleSets = ruleSets
      })
    })
  }
}

export default LoaderRulesPlugin
