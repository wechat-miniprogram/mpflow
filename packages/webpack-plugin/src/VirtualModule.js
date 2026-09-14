import NormalModule from 'webpack/lib/NormalModule'

// Keep dependency traversal and loader execution without emitting a JS factory.
export default class VirtualModule extends NormalModule {
  getSourceTypes() {
    if (this._sourceTypes === undefined) this._sourceTypes = new Set()
    return this._sourceTypes
  }

  codeGeneration() {
    return { sources: new Map(), runtimeRequirements: new Set() }
  }
}
