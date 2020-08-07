import { webpackTestUtils } from '@weflow/test-utils'
import path from 'path'

export default function expectToMatchExampleDist(assets: Record<string, string>, example: string): Promise<void> {
  return webpackTestUtils.expectAssetToMatchDir(assets, path.resolve(__dirname, '../../examples', example, 'dist'))
}
