import { Generator } from '../src/Generator'
import { Volume, createFsFromVolume } from 'memfs'

describe('Generator', () => {
  test('should extend package', async () => {
    const volume = new Volume()
    volume.fromJSON({
      '/package.json': '{"name": "test"}',
    })
    const fs = createFsFromVolume(volume)
    const generator = new Generator('/', { inputFileSystem: fs as any, outputFileSystem: fs as any })
    generator.extendPackage(
      {
        scripts: {
          test: 'echo "test"',
        },
        dependencies: {
          module: '^1.0.0',
        },
      },
      'test',
    )
    await generator.generate()
    expect(JSON.parse(fs.readFileSync('/package.json', 'utf8') as string)).toEqual({
      name: 'test',
      scripts: {
        test: 'echo "test"',
      },
      dependencies: {
        module: '^1.0.0',
      },
    })
  })
})
