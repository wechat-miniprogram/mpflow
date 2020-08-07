const { spawnSync } = require('child_process')
const { resolve } = require('path')

const resolveFromCwd = (...paths) => resolve(process.cwd(), ...paths)

const resolveFromRoot = (...paths) => resolve(__dirname, '..', ...paths)

const runScript = (command, args) => {
  const isWin = process.platform === 'win32'

  let PATH = isWin ? 'Path' : 'PATH'

  const { status, error } = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      [PATH]: `${process.env[PATH]}${isWin ? ';' : ':'}${resolveFromRoot('node_modules/.bin')}`,
    },
  })

  if (error) {
    console.error(error)
    throw error
  }

  if (status !== 0) {
    throw new Error(`command ${command} returns status code ${status}`)
  }
}

module.exports = {
  resolveFromCwd,
  resolveFromRoot,
  runScript,
}
