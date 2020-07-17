import { Plugin } from './PluginAPI'
import Service from './Service'

const service = new Service(process.cwd())

service.run()

export type { ConfigChain as WeflowPluginConfigChain } from '@weflow/webpack-plugin'
export type { PluginAPI } from './PluginAPI'
export { Plugin }
