import { Stats } from 'webpack'
import normalizeErrors from './normalizeErrors'

export default function getWarnings(stats: Stats): string[] {
  return normalizeErrors(stats.compilation.warnings)
}
