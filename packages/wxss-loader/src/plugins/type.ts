import { Message } from 'postcss'

export interface PluginImportMessage extends Message {
  type: 'import'
  value: {
    importName: string
    url: string
  }
}

export interface PluginChildImportMessage extends Message {
  type: 'child-import'
  value: {
    importName: string
  }
}

export interface PluginReplaceMessage extends Message {
  type: 'replacer'
  value: {
    pattern: string | RegExp
    target: string
    replacerName: string
  }
}
