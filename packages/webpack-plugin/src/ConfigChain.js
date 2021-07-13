import Config from 'webpack-chain'
import ChainedMap from 'webpack-chain/src/ChainedMap'
import ChainedSet from 'webpack-chain/src/ChainedSet'
import Resolve from 'webpack-chain/src/Resolve'
import Rule from 'webpack-chain/src/Rule'

class ResolveConfig extends ChainedMap {
  constructor(parent) {
    super(parent)

    this.roots = new ChainedSet(this)

    this.sitemap = new Resolve(this)
    this.page = new Resolve(this)
    this.json = new Resolve(this)
    this.javascript = new Resolve(this)
    this.wxml = new Resolve(this)
    this.wxss = new Resolve(this)
    this.icon = new Resolve(this)
  }

  toConfig() {
    return this.clean({
      ...(this.entries() || {}),
      roots: this.roots.values(),
      sitemap: this.sitemap.toConfig(),
      page: this.page.toConfig(),
      json: this.json.toConfig(),
      javascript: this.javascript.toConfig(),
      wxml: this.wxml.toConfig(),
      wxss: this.wxss.toConfig(),
      icon: this.icon.toConfig(),
    })
  }
}

class RulesConfig extends ChainedMap {
  constructor(parent) {
    super(parent)

    this.sitemapRules = this.setupRules('sitemap', this)
    this.pageRules = this.setupRules('page', this)
    this.jsonRules = this.setupRules('json', this)
    this.javascriptRules = this.setupRules('javascript', this)
    this.wxmlRules = this.setupRules('wxml', this)
    this.wxssRules = this.setupRules('wxss', this)
    this.iconRules = this.setupRules('icon', this)
  }

  setupRules(field, parent) {
    const rules = new ChainedMap(parent)
    this[field] = name => rules.getOrCompute(name, () => new Rule(this, name, 'rule'))
    return rules
  }

  toConfig() {
    return this.clean({
      ...(this.entries() || {}),
      sitemap: this.sitemapRules.values().map(r => r.toConfig()),
      page: this.pageRules.values().map(r => r.toConfig()),
      json: this.jsonRules.values().map(r => r.toConfig()),
      javascript: this.javascriptRules.values().map(r => r.toConfig()),
      wxml: this.wxmlRules.values().map(r => r.toConfig()),
      wxss: this.wxssRules.values().map(r => r.toConfig()),
      icon: this.iconRules.values().map(r => r.toConfig()),
    })
  }
}

class ProgramConfig extends ChainedMap {
  constructor(parent) {
    super(parent)

    this.extend([
      'appId',
      'outputPath',
      'projectName',
      'compileType',
      'miniprogramRoot',
      'qcloudRoot',
      'pluginRoot',
      'settings',
      'useExtendedLib',
    ])
  }

  toConfig() {
    return this.entries()
  }
}

export class ConfigChain extends ChainedMap {
  constructor(parent) {
    super(parent)

    this.resolve = new ResolveConfig(this)
    this.rules = new RulesConfig(this)
    this.externals = new ChainedSet(this)
    this.program = new ProgramConfig(this)
  }

  static toString(config, options) {
    return Config.toString(config, options)
  }

  toConfig() {
    return this.clean({
      ...(this.entries() || {}),
      resolve: this.resolve.toConfig(),
      rules: this.rules.toConfig(),
      externals: this.externals.values(),
      program: this.program.toConfig(),
    })
  }

  toString(options) {
    return ConfigChain.toString(this.toConfig(), options)
  }
}
