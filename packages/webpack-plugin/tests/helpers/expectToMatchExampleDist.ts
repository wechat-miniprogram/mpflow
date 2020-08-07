import { loaderTestUtils } from '@weflow/test-utils'
import path from 'path'

export default function expectToMatchExampleDist(example: string, assets: Record<string, string>): Promise<void> {
  return loaderTestUtils.expectAssetToMatchDir(assets, path.resolve(__dirname, '../../examples', example, 'dist'))
}
