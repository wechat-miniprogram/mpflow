const path = require('node:path')
const fs = require('node:fs')
const bg = require('./pkg/wxml_parser_bg.js')

const bytes = fs.readFileSync(
  path.resolve(__dirname, './pkg/wxml_parser_bg.wasm'),
)

const wasmModule = new WebAssembly.Module(bytes)
const wasmInstance = new WebAssembly.Instance(wasmModule, {
  './wxml_parser_bg.js': bg,
})

bg.__wbg_set_wasm(wasmInstance.exports)

module.exports = bg