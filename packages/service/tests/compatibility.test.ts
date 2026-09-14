import fs from 'fs'
import os from 'os'
import path from 'path'
import webpack, { MultiWatching } from 'webpack'
import { createFsFromVolume, Volume } from 'memfs'
import { ServiceRunner } from '../src/ServiceRunner'

function createFixture(files: Record<string, string>) {
  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'mpflow-service-compat-'))
  const write = (name: string, content: string) => {
    const filename = path.join(context, name)
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, content)
  }
  for (const [name, content] of Object.entries(files)) write(name, content)
  return { context, write }
}

const quiet = (config: any) => {
  config.plugins.delete('progress')
  config.plugins.delete('pretty')
}

test('keeps license comments inside JavaScript', async () => {
  const { context } = createFixture({
    'app.js': '/*! @license Keep this notice */\nApp({});',
    'app.json': '{"pages":[]}',
  })
  const volume = new Volume()
  const output = createFsFromVolume(volume)
  try {
    const runner = new ServiceRunner(context, {
      config: {
        app: 'app',
        miniprogramRoot: 'miniprogram',
        configureWebpackChain: quiet,
        _clean: false,
      } as any,
      outputFileSystem: output as any,
    })
    await runner.run(['build'])
    const read = (file: string) => output.readFileSync(path.join(context, 'dist', file), 'utf8').toString()
    expect(read('miniprogram/app.js')).toContain('@license Keep this notice')
    expect(Object.keys(volume.toJSON()).some(file => file.endsWith('.LICENSE.txt'))).toBe(false)
  } finally {
    fs.rmSync(context, { recursive: true, force: true })
  }
})

test('watch rebuilds styles and discovers new pages without losing cached entries', async () => {
  const { context, write } = createFixture({
    'app.js': 'App({});',
    'app.json': '{"pages":["pages/index"]}',
    'pages/index.js': 'Page({version:1});',
    'pages/index.wxml': '<view>first</view>',
    'pages/index.wxss': '.a { color: red; }',
  })
  const output = createFsFromVolume(new Volume())
  const runner = new ServiceRunner(context, {
    config: { app: 'app', sourceMap: false, configureWebpackChain: quiet, _clean: false } as any,
  })
  await runner.init()
  const compiler = webpack(Object.values(await runner.resolveWebpackConfigs()))
  compiler.outputFileSystem = output as any
  let watcher: MultiWatching | undefined
  try {
    await new Promise<void>((resolve, reject) => {
      let stage = 0
      const timeout = setTimeout(() => reject(new Error(`Watch did not reach stage ${stage + 1}`)), 10000)
      watcher = compiler.watch({ aggregateTimeout: 20, poll: 50 }, (error, stats) => {
        try {
          if (error) throw error
          if (!stats || stats.hasErrors()) throw new Error(stats?.toString('errors-warnings') || 'No watch statistics')
          const assets = stats.stats[0].compilation.getAssets().map(asset => asset.name)
          const style = output.readFileSync(path.join(context, 'dist/pages/index.wxss'), 'utf8').toString()
          expect(assets).toContain('pages/index.js')
          if (stage === 0) {
            expect(style).toContain('red')
            stage = 1
            setTimeout(() => write('pages/index.wxss', '.a { color: blue; }'), 100)
          } else if (stage === 1) {
            // Watchpack may deliver an initial filesystem scan before the scheduled edit.
            if (!style.includes('blue')) return
            expect(style).toContain('blue')
            stage = 2
            setTimeout(() => {
              write('pages/second.js', 'Page({version:2});')
              write('pages/second.wxml', '<view>second</view>')
              write('app.json', '{"pages":["pages/index","pages/second"]}')
            }, 100)
          } else {
            if (!assets.includes('pages/second.js')) return
            expect(style).toContain('blue')
            expect(assets).toContain('pages/second.js')
            expect(assets).toContain('pages/second.wxml')
            clearTimeout(timeout)
            resolve()
          }
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      })
    })
  } finally {
    if (watcher)
      await new Promise<void>((resolve, reject) => watcher!.close(error => (error ? reject(error) : resolve())))
    await new Promise<void>((resolve, reject) => compiler.close(error => (error ? reject(error) : resolve())))
    fs.rmSync(context, { recursive: true, force: true })
  }
}, 15000)
