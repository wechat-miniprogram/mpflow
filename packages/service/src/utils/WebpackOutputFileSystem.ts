import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

class WebpackOutputFileSystem {
  fileSystem: typeof fs

  constructor(fileSystem: typeof fs) {
    this.fileSystem = fileSystem

    this.mkdir = fileSystem.mkdir.bind(fileSystem)
    this.rmdir = fileSystem.rmdir.bind(fileSystem)
    this.unlink = fileSystem.unlink.bind(fileSystem)
    this.writeFile = fileSystem.writeFile.bind(fileSystem)
    this.join = path.join.bind(path)
  }

  mkdir: typeof fs['mkdir']
  rmdir: typeof fs['rmdir']
  unlink: typeof fs['unlink']
  writeFile: typeof fs['writeFile']
  join: typeof path['join']

  mkdirp(dir: string, cb: (err: NodeJS.ErrnoException, made: mkdirp.Made) => void): void
  mkdirp(
    dir: string,
    opts: mkdirp.Mode | mkdirp.Options,
    cb: (err: NodeJS.ErrnoException, made: mkdirp.Made) => void,
  ): void
  mkdirp(dir: string, opts: any, cb?: any): void {
    let options: mkdirp.Options
    let callback: (err: NodeJS.ErrnoException, made: mkdirp.Made) => void
    if (!cb) {
      callback = opts
      options = {}
    } else {
      callback = cb
      options = typeof opts === 'object' ? opts : { mode: opts }
    }
    return mkdirp(dir, { ...options, fs: this.fileSystem }, callback)
  }
}

export default WebpackOutputFileSystem
