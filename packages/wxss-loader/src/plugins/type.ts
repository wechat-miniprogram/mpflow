import { ResultMessage } from 'postcss'

export interface PluginImportMessage extends ResultMessage {
  type: 'import'
  value: {
    importName: string
    url: string
  }
}

export interface PluginChildImportMessage extends ResultMessage {
  type: 'child-import'
  value: {
    importName: string
  }
}

export interface PluginReplaceMessage extends ResultMessage {
  type: 'replacer'
  value: {
    pattern: string | RegExp
    target: string
    replacerName: string
  }
}
