module.exports = {
  preset: '@mpflow/plugin-unit-test',
  bail: 1,
  verbose: true,
  testURL: 'https://jest.test',
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['<rootDir>/src/**/__test(s)?__/**/*.(spec|test).{js,ts}'],
  transform: {
    '^.+\\.(j|t)s$': [
      'babel-jest',
      { configFile: require.resolve('./babel.config.js') }
    ],
  },
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts}',
    '!**/__test(s)?__/**'
  ],
}
