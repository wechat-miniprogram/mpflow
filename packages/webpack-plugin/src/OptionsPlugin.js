import ejs from 'ejs'

const PLUGIN_NAME = 'Mpflow Options Plugin'

/**
 * Sets a constant default value when undefined
 * @template T
 * @template {keyof T} P
 * @param {T} obj an object
 * @param {P} prop a property of this object
 * @param {T[P]} value a default value of the property
 * @returns {void}
 */
const D = (obj, prop, value) => {
  if (obj[prop] === undefined) {
    obj[prop] = value
  }
}

/**
 * OptionsPlugin 设置一些默认设置
 */
export default class OptionsPlugin {
  constructor() {}

  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    const output = compiler.options.output
    const environment = output.environment || {}

    D(output, 'globalObject', 'globalThis')
    D(output, 'chunkFormat', 'commonjs')
    D(output, 'chunkLoading', 'require')
    D(output, 'globalObject', 'globalThis')
    D(output, 'globalObject', 'globalThis')
    D(output, 'globalObject', 'globalThis')

    D(environment, 'arrowFunction', false)
    D(environment, 'const', false)
    D(environment, 'destructuring', false)
    D(environment, 'forOf', false)
    D(environment, 'bigIntLiteral', false)
    D(environment, 'dynamicImport', false)
    D(environment, 'module', false)

    output.environment = environment
  }
}
