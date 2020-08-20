import { webpackTestUtils } from '@mpflow/test-utils'
import { fs, vol } from 'memfs'
import path from 'path'
import { ServiceRunner } from '../src/ServiceRunner'

describe('ServiceRunner', () => {
  test('should build', async () => {
    const fixtureRoot = path.resolve(__dirname, './fixtures/build')
    const fixtureDist = path.resolve(fixtureRoot, 'dist')
    const runner = new ServiceRunner(fixtureRoot, { outputFileSystem: fs as any })
    ;(runner.config as any)._clean = false
    await runner.run(['build'])
    webpackTestUtils.expectAssetToMatchDir(vol.toJSON(fixtureDist, {}, true) as any, fixtureDist)
  })
})
