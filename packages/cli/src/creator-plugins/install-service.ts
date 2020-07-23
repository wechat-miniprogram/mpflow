import { CreatorPlugin } from '../Creator'

const installService: CreatorPlugin = () => {}

installService.creator = api => {
  api.afterEmit(async () => {
    // await api.exec('npm install @weflow/service --save-dev')
    await api.exec('yarn', ['link', '@weflow/service'])
  })
}

export default installService
