module.exports = {
  bail: 1,
  verbose: true,
  testEnvironment: 'jsdom',
  testURL: 'https://jest.test',
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['<rootDir>/src/**/__test__/**/*.test.{js,ts}'],
  collectCoverageFrom: [
      '<rootDir>/src/**/*.{js,ts}',
      '!**/__test__/**'
  ],
  snapshotSerializers: ['miniprogram-simulate/jest-snapshot-plugin']
}
