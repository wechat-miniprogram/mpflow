const { pathsToModuleNameMapper } = require('ts-jest/utils')

module.exports = {
  rootDir: process.cwd(),
  testMatch: ['**/*.test.{js,ts}'],
  transform: {
    '^.+\\.(j|t)s$': ['babel-jest', { configFile: require.resolve('./babel.config.js') }],
    // "^.+\\.ts$": "babel-jest",
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts}', '!**/__tests__/**'],
  moduleNameMapper: pathsToModuleNameMapper(require('./tsconfig.json').compilerOptions.paths, {
    prefix: '<rootDir>/../../',
  }),
}
