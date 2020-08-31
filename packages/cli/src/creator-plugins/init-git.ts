import { CreatorPlugin } from '../Creator'

const initGit: CreatorPlugin = () => {}

initGit.creator = api => {
  api.tapInit(async () => {
    const command = process.platform === 'win32' ? 'git.cmd' : 'git'
    try {
      await api.exec(command, ['init'])
    } catch (e) {
      console.error(e)
    }
  })
}

export default initGit
