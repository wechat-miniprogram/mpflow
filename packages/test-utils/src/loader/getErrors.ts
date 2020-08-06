import { Stats } from 'webpack'
import normalizeErrors from './normalizeErrors'

export default function getErrors(stats: Stats): string[] {
  return normalizeErrors(stats.compilation.errors)
}
