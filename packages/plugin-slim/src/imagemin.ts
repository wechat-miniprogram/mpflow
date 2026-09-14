import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'
import { Compiler, NormalModule } from 'webpack'

type ImageminFunction = (input: Buffer) => Buffer | Promise<Buffer>
type ImageminPlugin = string | [string, Record<string, unknown>] | ImageminFunction

function resolvePlugin(name: string): string {
  try {
    return require.resolve(name.startsWith('imagemin') ? name : `imagemin-${name}`)
  } catch {
    try {
      return require.resolve(name)
    } catch {
      // Report missing plugins during optimization, where webpack's final bail
      // policy is available, instead of aborting configuration construction.
      return name
    }
  }
}

async function minifyWithFunctions(
  original: ImageMinimizerPlugin.WorkerResult,
  options?: { plugins: ImageminPlugin[] },
): Promise<ImageMinimizerPlugin.WorkerResult | null> {
  const plugins = []
  for (const plugin of options?.plugins || []) {
    if (typeof plugin === 'function') plugins.push(plugin)
    else {
      try {
        const normalized = await ImageMinimizerPlugin.imageminNormalizeConfig({ plugins: [plugin] })
        plugins.push(...normalized.plugins)
      } catch (error) {
        original.errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }
  let data: Buffer
  try {
    data = await require('imagemin').buffer(original.data, { plugins })
  } catch (error) {
    original.errors.push(error instanceof Error ? error : new Error(String(error)))
    return null
  }
  return {
    ...original,
    data,
    info: { ...original.info, minimized: true, minimizedBy: ['imagemin', ...(original.info.minimizedBy || [])] },
  }
}

async function minifySinglePlugin(
  original: ImageMinimizerPlugin.WorkerResult,
  options?: { plugins: ImageminPlugin[] },
): Promise<ImageMinimizerPlugin.WorkerResult | null> {
  try {
    return await ImageMinimizerPlugin.imageminMinify(original, options)
  } catch (error) {
    // The upstream normalizer runs outside its own try/catch. Returning here
    // lets the worker apply severityError and continue the next minimizer stage.
    original.errors.push(error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

export function getImageminMinimizer(plugins: ImageminPlugin[]) {
  const resolved = plugins.map(plugin => {
    if (typeof plugin === 'function') return plugin
    if (typeof plugin === 'string') return resolvePlugin(plugin)
    if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
      return [resolvePlugin(plugin[0]), plugin[1]] as [string, Record<string, unknown>]
    }
    throw new Error('imagemin.plugins entries must be plugin names, [name, options], or initialized plugin functions')
  })
  return {
    implementation:
      resolved.length > 1 || resolved.some(plugin => typeof plugin === 'function')
        ? minifyWithFunctions
        : minifySinglePlugin,
    options: { plugins: resolved },
  }
}

// With the automatic loader disabled, propagate our explicit loaders' results
// through webpack's public asset hooks so emitted images are not processed twice.
export function markMinimizedModuleAssets(compiler: Compiler): void {
  const usesImageLoader = (module: object) =>
    (module as NormalModule).loaders?.some(loader => loader.loader === ImageMinimizerPlugin.loader)
  compiler.hooks.compilation.tap('Mpflow Minimized Module Assets', compilation => {
    compilation.hooks.moduleAsset.tap('Mpflow Minimized Module Assets', (module, filename) => {
      if (usesImageLoader(module)) compilation.updateAsset(filename, source => source, { minimized: true })
    })
    compilation.hooks.assetPath.tap('Mpflow Minimized Module Assets', (filename, data, info) => {
      if (info && data.module && usesImageLoader(data.module)) info.minimized = true
      return filename
    })
  })
}
