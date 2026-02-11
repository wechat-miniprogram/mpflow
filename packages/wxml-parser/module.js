import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as bg from './pkg/wxml_parser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const bytes = fs.readFileSync(
  path.resolve(__dirname, './pkg/wxml_parser.wasm'),
)

const wasmModule = new WebAssembly.Module(bytes)
const wasmInstance = new WebAssembly.Instance(wasmModule, {
  './wxml_parser.js': bg,
})

bg.__wbg_set_wasm(wasmInstance.exports)

export * from './pkg/wxml_parser.js'