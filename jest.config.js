const path = require('path')
const fs = require('fs')

const packageMappings = {}
for (const name of fs.readdirSync(path.join(__dirname, 'packages'))) {
  const dir = path.join(__dirname, 'packages', name)
  if (!fs.existsSync(path.join(dir, 'package.json'))) continue
  if (name === 'wxml-parser') {
    packageMappings['^@mpflow/wxml-parser$'] = path.join(dir, 'pkg/main.js')
  } else if (fs.existsSync(path.join(dir, 'src/index.ts')) || fs.existsSync(path.join(dir, 'src/index.js'))) {
    packageMappings[`^@mpflow/${name}$`] = path.join(dir, 'src')
    packageMappings[`^@mpflow/${name}/lib/(.*)$`] = path.join(dir, 'src/$1')
  }
}

module.exports = {
  rootDir: __dirname,
  testMatch: ['<rootDir>/packages/**/*.test.{js,ts}'],
  testPathIgnorePatterns: ['/node_modules/', '/template/'],
  snapshotFormat: { escapeString: true, printBasicPrototype: true },
  testEnvironment: 'node',
  transform: {
    '^.+\\.(j|t)s$': ['babel-jest', { configFile: require.resolve('./babel.config.js') }],
    // "^.+\\.ts$": "babel-jest",
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts}', '!**/__tests__/**'],
  moduleNameMapper: packageMappings,
}
