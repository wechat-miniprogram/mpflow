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

export interface PluginReplaceMessage {
  pluginName: string
  type: 'replacer'
  value: {
    pattern: string | RegExp
    target: string
    replacementName: string
  }
}

export type PluginMessage = PluginImportMessage | PluginChildImportMessage | PluginReplaceMessage

export interface PluginContext {
  messages: PluginMessage[]
}

export interface Plugin {
  (ast: WxmlNode[], context: PluginContext): void
}
