import NormalModule from 'webpack/lib/NormalModule'

export default class VirtualModule extends NormalModule {}

VirtualModule.prototype.source = null
