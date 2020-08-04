import { CreatorPlugin } from '../Creator'
import inquirer from 'inquirer'

const requestAppID: CreatorPlugin = () => {}

requestAppID.creator = api => {
  api.tapPrepare(async infos => {
    if (!infos.appId) {
      // 要求用户输入 APPID
      const { appId }: { appId: string } = await inquirer.prompt([
        {
          type: 'input',
          name: 'appId',
          message: '请输入小程序 appId 或测试号 (测试号可以在 https://developers.weixin.qq.com/sandbox 创建):',
          validate: value => (value ? true : '请输入 appId'),
        },
      ])
      infos.appId = appId
    }
    return infos
  })
}

export default requestAppID
