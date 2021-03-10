import webpack from 'webpack'

export default class VirtualModule extends webpack.NormalModule {
  constructor(options) {
    super(options)
  }

  getSourceTypes() {
    // 不返回 javascript 防止最终被渲染
    return new Set(['unknown'])
  }

  serialize(context) {
    super.serialize(context)
  }

  deserialize(context) {
    super.deserialize(context)
  }
}

webpack.util.serialization.register(VirtualModule, '@mpflow/webpack-plugin/lib/VirtualModule')
