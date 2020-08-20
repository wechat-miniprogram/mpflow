import { tokenize, parse, codegen } from '../src/wxml-parser'

describe('wxml parser', () => {
  describe('tokenize', () => {
    test('unary tag', () => {
      expect(tokenize('', '<a />')).toEqual([
        {
          type: 'startTag',
          tag: { val: 'a', pos: { line: 1, column: 1, file: '', source: 'a' } },
          attrs: [],
          unary: true,
          pos: { line: 1, column: 0, file: '', source: '<a />' },
        },
      ])
    })
    test('empty tag', () => {
      expect(tokenize('', '<a></a>')).toEqual([
        {
          type: 'startTag',
          tag: { val: 'a', pos: { line: 1, column: 1, file: '', source: 'a' } },
          attrs: [],
          unary: false,
          pos: { line: 1, column: 0, file: '', source: '<a>' },
        },
        {
          type: 'endTag',
          tag: { val: 'a', pos: { line: 1, column: 5, file: '', source: 'a' } },
          pos: { line: 1, column: 3, file: '', source: '</a>' },
        },
      ])
    })
    test('tag attrs', () => {
      expect(tokenize('', '<a src="123" bar="bar" s-t-m />')).toEqual([
        {
          type: 'startTag',
          tag: { val: 'a', pos: { line: 1, column: 1, file: '', source: 'a' } },
          attrs: [
            {
              type: 'attribute',
              name: {
                pos: { line: 1, column: 3, file: '', source: 'src' },
                val: 'src',
              },
              value: {
                pos: { line: 1, column: 8, file: '', source: '123' },
                val: '123',
              },
              pos: { line: 1, column: 3, file: '', source: 'src="123"' },
            },
            {
              type: 'attribute',
              name: {
                pos: { line: 1, column: 13, file: '', source: 'bar' },
                val: 'bar',
              },
              value: {
                pos: { line: 1, column: 18, file: '', source: 'bar' },
                val: 'bar',
              },
              pos: { line: 1, column: 13, file: '', source: 'bar="bar"' },
            },
            {
              type: 'attribute',
              name: {
                pos: { line: 1, column: 23, file: '', source: 's-t-m' },
                val: 's-t-m',
              },
              value: undefined,
              pos: { line: 1, column: 23, file: '', source: 's-t-m' },
            },
          ],
          unary: true,
          pos: { line: 1, column: 0, file: '', source: '<a src="123" bar="bar" s-t-m />' },
        },
      ])
    })
    test('tag text', () => {
      expect(tokenize('', '<a>he llo</a>')).toEqual([
        {
          attrs: [],
          pos: { column: 0, file: '', line: 1, source: '<a>' },
          tag: { pos: { column: 1, file: '', line: 1, source: 'a' }, val: 'a' },
          type: 'startTag',
          unary: false,
        },
        { pos: { column: 3, file: '', line: 1, source: 'he llo' }, raw: false, text: 'he llo', type: 'text' },
        {
          pos: { column: 9, file: '', line: 1, source: '</a>' },
          tag: { pos: { column: 11, file: '', line: 1, source: 'a' }, val: 'a' },
          type: 'endTag',
        },
      ])
    })
    test('tag multiline text', () => {
      expect(tokenize('', '<a>he\n llo\n world</a>')).toEqual([
        {
          attrs: [],
          pos: { column: 0, file: '', line: 1, source: '<a>' },
          tag: { pos: { column: 1, file: '', line: 1, source: 'a' }, val: 'a' },
          type: 'startTag',
          unary: false,
        },
        {
          pos: { column: 3, file: '', line: 1, source: 'he\n llo\n world' },
          raw: false,
          text: 'he\n llo\n world',
          type: 'text',
        },
        {
          pos: { column: 6, file: '', line: 3, source: '</a>' },
          tag: { pos: { column: 8, file: '', line: 3, source: 'a' }, val: 'a' },
          type: 'endTag',
        },
      ])
    })
    test('comment', () => {
      expect(tokenize('', '<!-- this is a comment -->')).toEqual([
        {
          type: 'comment',
          content: { pos: { column: 4, file: '', line: 1, source: ' this is a comment ' }, val: ' this is a comment ' },
          pos: { column: 0, file: '', line: 1, source: '<!-- this is a comment -->' },
        },
      ])
    })
    test('nest tag', () => {
      expect(tokenize('', '<a><b /></a>')).toEqual([
        {
          attrs: [],
          pos: { column: 0, file: '', line: 1, source: '<a>' },
          tag: { pos: { column: 1, file: '', line: 1, source: 'a' }, val: 'a' },
          type: 'startTag',
          unary: false,
        },
        {
          attrs: [],
          pos: { column: 3, file: '', line: 1, source: '<b />' },
          tag: { pos: { column: 4, file: '', line: 1, source: 'b' }, val: 'b' },
          type: 'startTag',
          unary: true,
        },
        {
          pos: { column: 8, file: '', line: 1, source: '</a>' },
          tag: { pos: { column: 10, file: '', line: 1, source: 'a' }, val: 'a' },
          type: 'endTag',
        },
      ])
    })
    test('raw text tag', () => {
      expect(tokenize('', '<wxs><>\n2</><a/></wxs>')).toEqual([
        {
          attrs: [],
          pos: { column: 0, file: '', line: 1, source: '<wxs>' },
          tag: { pos: { column: 1, file: '', line: 1, source: 'wxs' }, val: 'wxs' },
          type: 'startTag',
          unary: false,
        },
        {
          pos: { column: 5, file: '', line: 1, source: '<>\n2</><a/>' },
          raw: true,
          text: '<>\n2</><a/>',
          type: 'text',
        },
        {
          pos: { column: 8, file: '', line: 2, source: '</wxs>' },
          tag: { pos: { column: 10, file: '', line: 2, source: 'wxs' }, val: 'wxs' },
          type: 'endTag',
        },
      ])
    })
  })
})
