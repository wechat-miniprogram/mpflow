import { webpackTestUtils } from '@mpflow/test-utils'
import { fs, vol } from 'memfs'
import path from 'path'
import { ServiceRunner } from '../src/ServiceRunner'

async function testBuild(fixtureName: string) {
  const fixtureRoot = path.resolve(__dirname, `./fixtures/${fixtureName}`)
  const fixtureDist = path.resolve(fixtureRoot, 'dist')
  const runner = new ServiceRunner(fixtureRoot, { outputFileSystem: fs as any })
  let compilerCount = 0
  let closedCompilerCount = 0
  runner.config.configureWebpack = {
    plugins: [
      {
        apply(compiler) {
          compilerCount++
          compiler.hooks.shutdown.tapAsync('service-build-test', callback => {
            process.nextTick(() => {
              closedCompilerCount++
              callback()
            })
          })
        },
      },
    ],
  }
  // const runner = new ServiceRunner(fixtureRoot)
  ;(runner.config as any)._clean = false
  await runner.run(['build'])
  expect(closedCompilerCount).toBe(compilerCount)
  expect(compilerCount).toBeGreaterThan(0)
  await webpackTestUtils.expectAssetToMatchDir(vol.toJSON(fixtureDist, {}, true) as any, fixtureDist)
}

describe('ServiceRunner', () => {
  test('should build', async () => {
    await testBuild('build')
  })

  test('should build node_modules', async () => {
    await testBuild('build_node_modules')
  })
})
