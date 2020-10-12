import { WxmlNode } from '../wxml-parser'

export interface PluginImportMessage {
  pluginName: string
  type: 'import'
  value: {
    importName: string
    url: string
  }
}

export interface PluginChildImportMessage {
  pluginName: string
  type: 'child-import'
  value: {
    importName: string
  }
}

export interface PluginDeclareMessage {
  pluginName: string
  type: 'declare'
  value: {
    id: string
    init: string
  }
}

export interface PluginReplaceMessage {
  pluginName: string
  type: 'replacer'
  value: {
    pattern: string | RegExp
    target: string
    replacementName: string
  }
}

export type PluginMessage = PluginImportMessage | PluginChildImportMessage | PluginDeclareMessage | PluginReplaceMessage

export interface PluginContext {
  messages: PluginMessage[]
  fs: typeof import('fs')
  context: string
}

export interface Plugin {
  (ast: WxmlNode[], context: PluginContext): void | Promise<void>
}
