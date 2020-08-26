module.exports = {
  testEnvironment: 'jsdom',
  snapshotSerializers: [require.resolve('miniprogram-simulate/jest-snapshot-plugin')],
}
