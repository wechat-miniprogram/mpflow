import { webpackTestUtils } from '@mpflow/test-utils'
import { fs, vol } from 'memfs'
import path from 'path'
import { ServiceRunner } from '../src/ServiceRunner'

async function testBuild(fixtureName: string) {
  const fixtureRoot = path.resolve(__dirname, `./fixtures/${fixtureName}`)
  const fixtureDist = path.resolve(fixtureRoot, 'dist')
  const runner = new ServiceRunner(fixtureRoot, { outputFileSystem: fs as any })
  // const runner = new ServiceRunner(fixtureRoot)
  ;(runner.config as any)._clean = false
  await runner.run(['build'])
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
