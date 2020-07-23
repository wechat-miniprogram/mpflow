import { ArrayExpression, ASTPath, ObjectExpression, Statement, Transform } from 'jscodeshift'

const addPlugins: Transform = (fileInfo, api, { pluginNames }: { pluginNames: string[] }) => {
  const { source } = fileInfo
  const { j } = api

  if (typeof pluginNames === 'string') {
    pluginNames = (pluginNames as string).split(',')
  } else if (!Array.isArray(pluginNames)) {
    pluginNames = []
  }

  const root = j(source)
  // module.exports = { plugins: [] }
  let pluginsArrayExpression = root
    .find(j.AssignmentExpression, {
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'module',
        },
        property: {
          type: 'Identifier',
          name: 'exports',
        },
      },
      right: {
        type: 'ObjectExpression',
      },
    })
    .map<ObjectExpression>(p => p.get('right'))
    .find(
      j.Property,
      p =>
        j.match(p, {
          method: false,
          shorthand: false,
          computed: false,
          value: {
            type: 'ArrayExpression',
          },
        } as any) &&
        (j.match(p, {
          key: {
            type: 'Literal',
            value: 'plugins',
          },
        } as any) ||
          j.match(p, {
            key: {
              type: 'Identifier',
              name: 'plugins',
            },
          } as any)),
    )
    .map<ArrayExpression>(p => p.get('value'))

  // 如果没有 module.exports = { plugins: [] }
  // 则在文件末尾添加一句
  if (!pluginsArrayExpression.size()) {
    const pushStatement = j('exports.plugins = (exports.plugins || []).concat([]);').find(j.ExpressionStatement)

    pluginsArrayExpression = pushStatement.find(j.CallExpression).map(p => p.get('arguments', 0))

    const body: ASTPath<Statement[]> = root.find(j.Program).get('body')
    body.push(...pushStatement.nodes())
  }

  // 插入新的 pluginName
  pluginsArrayExpression.forEach(p => {
    p.value.elements.push
    pluginNames.forEach(pluginName => {
      p.get('elements').push(j.stringLiteral(pluginName))
    })
  })

  return root.toSource()
}

export default addPlugins
