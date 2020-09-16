import babel, { NodePath, PluginObj } from '@babel/core'
import { ArrayExpression, ObjectExpression } from '@babel/types'
import * as m from '@codemod/matchers'

export interface Options {
  fieldName: string
  items: (string | [string, any])[]
}

/**
 * 向配置文件如
 * module.exports = { plugins: [] }
 * 中的 plugins 添加插件信息
 */
export default function (api: typeof babel, options: Options): PluginObj {
  const { types: t, template } = api
  const { fieldName, items } = options

  let pluginsArrayExpression: NodePath<ArrayExpression>

  if (!fieldName || !items || !items.length)
    return {
      name: 'add-to-exports',
      visitor: {},
    }

  return {
    name: 'add-to-exports',
    visitor: {
      AssignmentExpression(p) {
        // 寻找 module.exports = { plugins: [] }
        if (
          !m
            .assignmentExpression(
              '=',
              m.memberExpression(m.identifier('module'), m.identifier('exports')),
              m.objectExpression(),
            )
            .match(p.node)
        )
          return

        const objectExpression = p.get('right') as NodePath<ObjectExpression>
        const properties = objectExpression.get('properties')

        properties.forEach(property => {
          if (
            !m
              .objectProperty(m.or(m.stringLiteral(fieldName), m.identifier(fieldName)), m.arrayExpression())
              .match(property.node)
          )
            return

          pluginsArrayExpression = property.get('value') as NodePath<ArrayExpression>
        })
      },
      Program: {
        exit(p) {
          if (!pluginsArrayExpression) {
            // 如果找不到 module.exports = { plugins: [] }
            // 则在末尾加一句 exports.plugins = (exports.plugins || []).concat([])
            const statement = template.statement(`
              exports.FIELD_NAME = (exports.FIELD_NAME || []).concat([]);
            `)({
              FIELD_NAME: t.identifier(fieldName),
            })
            const [statementPath] = p.pushContainer('body', statement)
            pluginsArrayExpression = statementPath.get('expression.right.arguments.0') as NodePath<ArrayExpression>
          }
          // 添加 item
          items.forEach(item => {
            const [pluginName, option] = Array.isArray(item) ? item : [item]
            if (!option) {
              pluginsArrayExpression.pushContainer('elements', t.stringLiteral(pluginName))
            } else {
              pluginsArrayExpression.pushContainer(
                'elements',
                t.arrayExpression([t.stringLiteral(pluginName), template.expression(JSON.stringify(option))()]),
              )
            }
          })
        },
      },
    },
  }
}
