import { ArrayExpression, ASTPath, ExpressionStatement, ObjectExpression, Statement, Transform } from 'jscodeshift'

const addToExports: Transform = (
  fileInfo,
  api,
  { fieldName, items }: { fieldName: string; items: (string | [string, any])[] },
) => {
  const { source } = fileInfo
  const { j } = api
  const { statement, expression } = j.template

  if (typeof items === 'string') {
    items = (items as string).split(',')
  } else if (!Array.isArray(items)) {
    items = []
  }

  if (!fieldName || !items.length) return

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
    .map<ObjectExpression['properties'][0]>(p => p.get('right', 'properties').map((i: any) => i))
    .filter(
      p =>
        j.match(p, {
          type: 'Property',
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
            value: fieldName,
          },
        } as any) ||
          j.match(p, {
            key: {
              type: 'Identifier',
              name: fieldName,
            },
          } as any)),
    )
    .map<ArrayExpression>(p => p.get('value'))

  // 如果没有 module.exports = { plugins: [] }
  // 则在文件末尾添加一句
  if (!pluginsArrayExpression.size()) {
    // exports.fieldName = (exports.fieldName || []).concat([])
    const pushStatement: ExpressionStatement = statement`\nexports.${fieldName} = (exports.${fieldName} || []).concat([]);`

    pluginsArrayExpression = j(pushStatement)
      .find(j.CallExpression)
      .map(p => p.get('arguments', 0))

    const body: ASTPath<Statement[]> = root.find(j.Program).get('body')
    body.push(pushStatement)
  }

  // 插入新的 pluginName
  pluginsArrayExpression.forEach(p => {
    items.forEach(item => {
      const [pluginName, option] = Array.isArray(item) ? item : [item]
      if (!option) {
        p.get('elements').push(j.stringLiteral(pluginName))
      } else {
        const optionExpression: ObjectExpression = j(`(${JSON.stringify(option)})`)
          .find(j.ExpressionStatement)
          .get('expression').value
        p.get('elements').push(j.arrayExpression([j.stringLiteral(pluginName), optionExpression]))
      }
    })
  })

  return root.toSource()
}

export default addToExports
