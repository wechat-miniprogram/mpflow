function removeCWD(str: string): string {
  const isWin = process.platform === 'win32'
  let cwd = process.cwd()

  if (isWin) {
    str = str.replace(/\\/g, '/')
    cwd = cwd.replace(/\\/g, '/')
  }

  return str.replace(/\(from .*?\)/, '(from `replaced original path`)').replace(new RegExp(cwd, 'g'), '')
}

export default function normalizeErrors(errors: Error[]): string[] {
  return errors.map(error => removeCWD(error.toString().split('\n').slice(0, 2).join('\n')))
}
