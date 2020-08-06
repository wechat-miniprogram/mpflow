import { Compiler, Stats } from 'webpack'

export default function compile(compiler: Compiler): Promise<Stats> {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        return reject(error)
      }

      return resolve(stats)
    })
  })
}
