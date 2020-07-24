import path from 'path'

const PLUGIN_NAME = 'Weflow Project Alias Plugin'

class DelegateInputFileSystem {
  constructor(fileSystem) {
    this.fileSystem = fileSystem
    this.delegateMap = new Map()
  }

  addDelegate(path, target) {
    this.delegateMap.set(path, target)
  }

  removeDelegate(path) {
    this.delegateMap.delete(path)
  }

  stat(path, callback) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.stat(path, callback)
  }

  readdir(path, callback) {
    return this.fileSystem.readdir(path, callback)
  }

  readFile(path, callback) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.readFile(path, callback)
  }

  readJson(path, callback) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.readJson(path, callback)
  }

  readlink(path, callback) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.readlink(path, callback)
  }

  statSync(path) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.statSync(path)
  }

  readdirSync(path) {
    return this.fileSystem.readdirSync(path)
  }

  readFileSync(path) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.readFileSync(path)
  }

  readJsonSync(path) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.readJsonSync(path)
  }

  readlinkSync(path) {
    if (this.delegateMap.has(path)) path = this.delegateMap.get(path)
    return this.fileSystem.readlinkSync(path)
  }

  purge(what) {
    return this.fileSystem.purge(what)
  }
}

class ProjectAliasPlugin {
  constructor(options) {
    this.options = options
  }

  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.environment.tap(PLUGIN_NAME, () => {
      const inputFileSystem = (compiler.inputFileSystem = new DelegateInputFileSystem(compiler.inputFileSystem))

      inputFileSystem.addDelegate(
        path.resolve(compiler.options.context, 'src/project.config.json'),
        path.resolve(compiler.options.context, 'project.config.json'),
      )
    })
  }
}

export default ProjectAliasPlugin
