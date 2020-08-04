import { CreatorPlugin } from '../Creator'

const initGit: CreatorPlugin = () => {}

initGit.creator = api => {
  api.tapInit(async () => {
    await api.exec('git', ['init'])
  })
}

export default initGit
