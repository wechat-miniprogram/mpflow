declare class MpPlugin {
  constructor(options?: any)
  apply(compiler: any): void

  static target: (compiler: any) => void
  static appLoader: string
  static pageLoader: string
  static externalLoader: string
  static assetLoader: string
}

export = MpPlugin
