import Service from './Service'
import { Plugin, PluginAPI } from './PluginAPI'

const service = new Service(process.cwd())

service.run()

export { Plugin }
export type PluginApi = PluginAPI
