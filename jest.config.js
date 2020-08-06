const { pathsToModuleNameMapper } = require('ts-jest/utils')

module.exports = {
  rootDir: process.cwd(),
  transform: {
    '^.+\\.(j|t)s$': ['babel-jest', { configFile: require.resolve('./babel.config.js') }],
    // "^.+\\.ts$": "babel-jest",
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts}'],
  moduleNameMapper: pathsToModuleNameMapper(require('./tsconfig.json').compilerOptions.paths, {
    prefix: '<rootDir>/../../',
  }),
}
