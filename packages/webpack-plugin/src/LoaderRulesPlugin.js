import webpack from 'webpack'
import BasicEffectRulePlugin from 'webpack/lib/rules/BasicEffectRulePlugin'
import BasicMatcherRulePlugin from 'webpack/lib/rules/BasicMatcherRulePlugin'
import DescriptionDataMatcherRulePlugin from 'webpack/lib/rules/DescriptionDataMatcherRulePlugin'
import RuleSetCompiler from 'webpack/lib/rules/RuleSetCompiler'
import UseEffectRulePlugin from 'webpack/lib/rules/UseEffectRulePlugin'

const PLUGIN_NAME = 'Mpflow Loader Rules Plugin'

const ruleSetCompiler = new RuleSetCompiler([
  new BasicMatcherRulePlugin('test', 'resource'),
  new BasicMatcherRulePlugin('mimetype'),
  new BasicMatcherRulePlugin('dependency'),
  new BasicMatcherRulePlugin('include', 'resource'),
  new BasicMatcherRulePlugin('exclude', 'resource', true),
  new BasicMatcherRulePlugin('conditions'),
  new BasicMatcherRulePlugin('resource'),
  new BasicMatcherRulePlugin('resourceQuery'),
  new BasicMatcherRulePlugin('resourceFragment'),
  new BasicMatcherRulePlugin('realResource'),
  new BasicMatcherRulePlugin('issuer'),
  new BasicMatcherRulePlugin('compiler'),
  new DescriptionDataMatcherRulePlugin(),
  new BasicEffectRulePlugin('type'),
  new BasicEffectRulePlugin('sideEffects'),
  new BasicEffectRulePlugin('parser'),
  new BasicEffectRulePlugin('resolve'),
  new BasicEffectRulePlugin('generator'),
  new UseEffectRulePlugin(),
])

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
      sitemap: ruleSetCompiler.compile([{ rules: sitemap }]),
      page: ruleSetCompiler.compile([{ rules: page }]),
      json: ruleSetCompiler.compile([{ rules: json }]),
      javascript: ruleSetCompiler.compile([{ rules: javascript }]),
      wxml: ruleSetCompiler.compile([{ rules: wxml }]),
      wxss: ruleSetCompiler.compile([{ rules: wxss }]),
      icon: ruleSetCompiler.compile([{ rules: icon }]),
    }
  }

  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    const ruleSets = this.ruleSets
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(PLUGIN_NAME, context => {
        context.__mpflowRuleSets = ruleSets
      })
    })
  }
}

export default LoaderRulesPlugin
