module.exports = {
  // globalSetup: "./tests/globalSetup.js",
  // globalTeardown: "./tests/globalTeardown.js",
  testEnvironment: require.resolve('./lib/MiniprogramEnvironment.js'),
  setupFilesAfterEnv: [require.resolve('./lib/testSetup.js')],
}
