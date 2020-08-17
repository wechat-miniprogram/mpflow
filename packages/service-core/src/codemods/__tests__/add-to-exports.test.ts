import jscodeshift from 'jscodeshift'
import fs from 'fs'
import path from 'path'
import transform from '../add-to-exports'

const transformShouldEqual = (
  options: { fieldName?: string; items?: (string | [string, any])[] },
  source: string,
  expected?: string,
) => {
  const fixtureDir = path.resolve(__dirname, './fixtures/add-to-exports')
  const sourceContent = fs.readFileSync(path.join(fixtureDir, source), 'utf8')
  const expectedContent = expected ? fs.readFileSync(path.join(fixtureDir, expected), 'utf8') : undefined
  const transformedContent = transform(
    { path: source, source: sourceContent },
    { jscodeshift, j: jscodeshift, report: () => {}, stats: () => {} },
    options,
  )
  expect(transformedContent).toEqual(expectedContent)
}

describe('add-to-exports', () => {
  test('should ignore', () => {
    transformShouldEqual({}, 'ignore.js')
    transformShouldEqual({ fieldName: 'presets' }, 'ignore.js')
    transformShouldEqual({ items: ['1', '2'] }, 'ignore.js')
  })

  test('should add presets', () => {
    transformShouldEqual({ fieldName: 'presets', items: ['1', '2'] }, 'add-presets.js', 'add-presets.expected.js')
  })

  test('should add plugins', () => {
    transformShouldEqual({ fieldName: 'plugins', items: ['1', '2'] }, 'add-plugins.js', 'add-plugins.expected.js')
  })

  test('should add empty presets', () => {
    transformShouldEqual(
      { fieldName: 'presets', items: ['1', '2'] },
      'add-empty-presets.js',
      'add-empty-presets.expected.js',
    )
  })

  test('should add plugins with option', () => {
    transformShouldEqual(
      { fieldName: 'plugins', items: [['1', { first: true }], '2'] },
      'add-plugins-and-option.js',
      'add-plugins-and-option.expected.js',
    )
  })
})
