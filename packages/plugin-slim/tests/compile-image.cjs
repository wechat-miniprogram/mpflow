const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { ServiceRunner } = require('@mpflow/service')
const webpack = require(require.resolve('webpack', {
  paths: [path.dirname(require.resolve('@mpflow/service/package.json'))],
}))
const pluginSlim = require('../lib').default
const { getImageminMinimizer } = require('../lib/imagemin')
const imagemin = require('imagemin')
const svgo = require('imagemin-svgo')

;(async () => {
  const kind = process.argv[2]
  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'mpflow-slim-'))
  const input = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">\n  <rect width="10" height="10" fill="red"/>\n</svg>',
  )
  const svgOptions = { plugins: [{ removeViewBox: false }] }
  let customCalls = 0
  const custom = buffer => {
    customCalls++
    return Buffer.from(buffer.toString().replace('<rect', '<rect data-custom="yes"'))
  }
  let failureCalls = 0
  const failing = () => {
    failureCalls++
    throw new Error('custom optimizer failed')
  }
  const badFactory = path.join(context, 'bad-factory.cjs')
  fs.writeFileSync(badFactory, 'module.exports = function() { throw new Error("optimizer factory failed") }')
  const normalizationPlugins = ['mpflow-missing-optimizer-for-test', [badFactory, {}], custom]
  const configurations = {
    format: { svg: true },
    'custom-string': { plugins: ['svgo'] },
    'custom-tuple': { plugins: [['svgo', svgOptions]] },
    'custom-function': { plugins: [svgo(svgOptions)] },
    combined: { svg: true, plugins: [custom] },
    failure: { plugins: [failing] },
    'failure-bail': { plugins: [failing] },
    'combined-failure': { svg: true, plugins: [failing] },
    'format-failure': { svg: true, plugins: [custom] },
    normalization: { plugins: normalizationPlugins },
    'normalization-bail': { plugins: normalizationPlugins },
  }
  fs.writeFileSync(path.join(context, 'app.js'), 'module.exports = require("./image.svg");')
  fs.writeFileSync(path.join(context, 'app.json'), '{"pages":[]}')
  fs.writeFileSync(path.join(context, 'image.svg'), input)
  let compiler
  try {
    const runner = new ServiceRunner(context, {
      config: {
        app: 'app',
        sourceMap: false,
        minimize: false,
        _clean: false,
        configureWebpackChain(config) {
          config.plugins.delete('progress')
          config.plugins.delete('pretty')
          if (kind.endsWith('-bail')) config.bail(true)
          if (kind === 'format-failure')
            config.module
              .rule('imagemin-svg')
              .use('imagemin-loader')
              .tap(options => ({
                ...options,
                minimizer: [options.minimizer[0], getImageminMinimizer([failing])],
              }))
          if (kind === 'combined' || kind === 'combined-failure')
            config.plugin('copy-svg').use({
              apply(compiler) {
                compiler.hooks.thisCompilation.tap('copy-svg', compilation => {
                  compilation.hooks.processAssets.tap(
                    { name: 'copy-svg', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
                    () => {
                      compilation.emitAsset('copy.svg', new webpack.sources.RawSource(input))
                    },
                  )
                })
              },
            })
        },
      },
      plugins: [{ id: '@mpflow/plugin-slim', module: pluginSlim, option: { imagemin: configurations[kind] } }],
    })
    await runner.init()
    compiler = webpack(Object.values(await runner.resolveWebpackConfigs()))
    let stats
    try {
      stats = await new Promise((resolve, reject) =>
        compiler.run((error, stats) => (error ? reject(error) : resolve(stats))),
      )
    } catch (error) {
      if (!kind.endsWith('-bail')) throw error
      assert.match(error.message, kind === 'normalization-bail' ? /Unknown plugin/ : /custom optimizer failed/)
      console.log(JSON.stringify({ kind, preservesBail: true }))
      return
    }
    if (kind.endsWith('-bail')) {
      assert.equal(stats.hasErrors(), true, 'bail must turn optimizer failures into compilation errors')
      console.log(JSON.stringify({ kind, preservesBail: true }))
      return
    }
    assert.equal(stats.hasErrors(), false, stats.toString('errors-only'))
    if (['failure', 'combined-failure', 'format-failure', 'normalization'].includes(kind))
      assert.equal(stats.hasWarnings(), true)
    else assert.equal(stats.hasWarnings(), false, stats.toString('errors-warnings'))
    const assets = stats.stats[0].compilation.getAssets().map(asset => asset.name)
    const imported = assets.find(name => name.includes('image.') && name.endsWith('.svg'))
    assert.ok(imported, 'SVG import should be emitted')
    const output = fs.readFileSync(path.join(context, 'dist', imported))
    const expectedPlugins = {
      format: [svgo(svgOptions)],
      'custom-string': [svgo()],
      'custom-tuple': [svgo(svgOptions)],
      'custom-function': [svgo(svgOptions)],
      combined: [custom, svgo(svgOptions)],
      'combined-failure': [svgo(svgOptions)],
      'format-failure': [custom],
      normalization: [custom],
    }
    const callsAfterCompile = customCalls
    const expected = kind === 'failure' ? input : await imagemin.buffer(input, { plugins: expectedPlugins[kind] })
    assert.deepEqual(
      output,
      expected,
      'Webpack loader output must match the existing imagemin/SVGO engine byte for byte',
    )
    const digest = webpack.util.createHash('md4').update(output).digest('hex').slice(0, 8)
    assert.ok(
      imported.endsWith(`/image.${digest}.svg`),
      'Compressed resource filenames must keep their MD4 content hash',
    )
    if (kind === 'format' || kind === 'custom-tuple' || kind === 'custom-function')
      assert.ok(output.includes('viewBox='))
    if (kind === 'combined') {
      assert.equal(callsAfterCompile, 2, 'Custom plugin should run once for the import and once for the copied asset')
      assert.deepEqual(
        fs.readFileSync(path.join(context, 'dist/copy.svg')),
        custom(input),
        'Copied assets should only use the global custom pipeline',
      )
    }
    if (kind === 'combined-failure') {
      assert.equal(failureCalls, 2, 'The failed custom optimizer must not be retried on imported assets')
      assert.deepEqual(fs.readFileSync(path.join(context, 'dist/copy.svg')), input)
      assert.notDeepEqual(output, input, 'The format stage must still compress the SVG')
    }
    if (kind === 'format-failure') assert.equal(failureCalls, 1)
    if (kind === 'normalization') {
      assert.equal(stats.stats[0].compilation.warnings.length, 2, 'Each invalid plugin must be reported')
      assert.equal(callsAfterCompile, 1, 'A valid plugin after invalid entries must still run once')
    }
    console.log(
      JSON.stringify({
        kind,
        inputBytes: input.length,
        outputBytes: output.length,
        matchesEngineBytes: true,
        customCalls: callsAfterCompile,
      }),
    )
  } finally {
    if (compiler) await new Promise((resolve, reject) => compiler.close(error => (error ? reject(error) : resolve())))
    fs.rmSync(context, { recursive: true, force: true })
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
