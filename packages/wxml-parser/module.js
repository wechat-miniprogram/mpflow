import * as bg from './pkg/wxml_parser_bg.js'
import wasmB64 from "./pkg/wxml_parser_bg.wasm";

const wasmBuffer = Uint8Array.from(atob(wasmB64), (c) => c.charCodeAt(0)); // Convert base64 to Uint8Array.

const wasmModule = new WebAssembly.Module(wasmBuffer)
const wasmInstance = new WebAssembly.Instance(wasmModule, {
  './wxml_parser_bg.js': bg,
})

bg.__wbg_set_wasm(wasmInstance.exports)

export * from './pkg/wxml_parser_bg.js'