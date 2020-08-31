import { CreatorPlugin } from '../Creator'
import boxen from 'boxen'
import chalk from 'chalk'
import { shouldUseYarn } from '../utils'

const printInstructions: CreatorPlugin = () => {}

printInstructions.creator = api => {
  api.tapAfterInit(async (context, { projectName }) => {
    const useYarn = shouldUseYarn()

    const message = boxen(
      `创建项目 ${chalk.yellow(projectName)} 成功！\n` +
        '使用以下命令开始开发：\n' +
        '\n' +
        `${chalk.gray('$')} ${chalk.cyan(`cd ${projectName}`)}\n` +
        `${chalk.gray('$')} ${chalk.cyan(useYarn ? 'yarn dev --open' : 'npm run dev:open')}`,
      {
        padding: 1,
        margin: 1,
        align: 'left',
        borderColor: 'cyan',
        borderStyle: 'round' as any,
      },
    )
    console.log(message)
  })
}

export default printInstructions
