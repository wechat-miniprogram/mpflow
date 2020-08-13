import path from 'path'
import simulate from 'miniprogram-simulate'

describe('<%- name %>', () => {
    let id

    beforeAll(() => {
        id = simulate.load(path.resolve(__dirname, '../<%- name %>'), { less: true })
    })

    test('should match snapshot', () => {
        const comp = simulate.render(id, {})
        comp.attach(document.createElement('parent-wrapper'))

        expect(comp.toJSON()).toMatchSnapshot()
    })
})
