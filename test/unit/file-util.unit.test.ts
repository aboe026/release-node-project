import Ajv, { JTDSchemaType } from 'ajv/dist/jtd'
import fs from 'fs/promises'
import path from 'path'

import FileUtil from '../../src/file-util'

describe('File Util', () => {
  describe('validateFile', () => {
    it('throws error if filePath is undefined', async () => {
      const optionKey = 'toast'
      const accessSpy = jest.spyOn(fs, 'access')
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute')
      const joinSpy = jest.spyOn(path, 'join')

      await expect(FileUtil.validateFile(undefined, optionKey)).rejects.toThrow(
        `Option "${optionKey}" required but not provided.`
      )

      expect(accessSpy.mock.calls).toEqual([])
      expect(isAbsoluteSpy.mock.calls).toEqual([])
      expect(joinSpy.mock.calls).toEqual([])
    })
    it('throws error if filePath is empty string', async () => {
      const optionKey = 'toast'
      const accessSpy = jest.spyOn(fs, 'access')
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute')
      const joinSpy = jest.spyOn(path, 'join')

      await expect(FileUtil.validateFile('', optionKey)).rejects.toThrow(
        `Option "${optionKey}" required but not provided.`
      )

      expect(accessSpy.mock.calls).toEqual([])
      expect(isAbsoluteSpy.mock.calls).toEqual([])
      expect(joinSpy.mock.calls).toEqual([])
    })
    it('throws error if relative filePath cannot be accessed', async () => {
      const optionKey = 'toast'
      const filePath = 'jelly.xml'
      const rootRepoDir = path.join(__dirname, '../../')
      const absoluteFilePath = path.join(rootRepoDir, filePath)
      const error = 'Access Denied'
      const accessSpy = jest.spyOn(fs, 'access').mockRejectedValue(error)
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute')
      const joinSpy = jest.spyOn(path, 'join')

      await expect(FileUtil.validateFile(filePath, optionKey)).rejects.toThrow(
        `Could not access file "${absoluteFilePath}": ${error}`
      )

      expect(accessSpy.mock.calls).toEqual([[absoluteFilePath]])
      expect(isAbsoluteSpy.mock.calls).toEqual([[filePath]])
      expect(joinSpy.mock.calls).toEqual([[rootRepoDir.substring(0, rootRepoDir.length - 1), filePath]])
    })
    it('throws error if absolute filePath cannot be accessed', async () => {
      const optionKey = 'toast'
      const filePath = path.join(__dirname, '../../', 'jelly.xml')
      const error = 'Access Denied'
      const accessSpy = jest.spyOn(fs, 'access').mockRejectedValue(error)
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute')
      const joinSpy = jest.spyOn(path, 'join')

      await expect(FileUtil.validateFile(filePath, optionKey)).rejects.toThrow(
        `Could not access file "${filePath}": ${error}`
      )

      expect(accessSpy.mock.calls).toEqual([[filePath]])
      expect(isAbsoluteSpy.mock.calls).toEqual([[filePath]])
      expect(joinSpy.mock.calls).toEqual([])
    })
    it('returns absolute file path for valid relative file', async () => {
      const optionKey = 'toast'
      const filePath = 'jelly.xml'
      const rootRepoDir = path.join(__dirname, '../../')
      const absoluteFilePath = path.join(rootRepoDir, filePath)
      const accessSpy = jest.spyOn(fs, 'access').mockResolvedValue()
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute')
      const joinSpy = jest.spyOn(path, 'join')

      await expect(FileUtil.validateFile(filePath, optionKey)).resolves.toEqual(absoluteFilePath)

      expect(accessSpy.mock.calls).toEqual([[absoluteFilePath]])
      expect(isAbsoluteSpy.mock.calls).toEqual([[filePath]])
      expect(joinSpy.mock.calls).toEqual([[rootRepoDir.substring(0, rootRepoDir.length - 1), filePath]])
    })
    it('returns absolute file path for valid absolute file', async () => {
      const optionKey = 'toast'
      const rootRepoDir = path.join(__dirname, '../../')
      const filePath = path.join(rootRepoDir, 'jelly.xml')
      const accessSpy = jest.spyOn(fs, 'access').mockResolvedValue()
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute')
      const joinSpy = jest.spyOn(path, 'join')

      await expect(FileUtil.validateFile(filePath, optionKey)).resolves.toEqual(filePath)

      expect(accessSpy.mock.calls).toEqual([[filePath]])
      expect(isAbsoluteSpy.mock.calls).toEqual([[filePath]])
      expect(joinSpy.mock.calls).toEqual([])
    })
  })

  describe('getJsonFromFile', () => {
    it('throws error if file cannot be read', async () => {
      const filePath = 'jelly.xml'
      const error = 'Access Denied'
      const readFileSpy = jest.spyOn(fs, 'readFile').mockRejectedValue(Error(error))
      const jsonParseSpy = jest.spyOn(JSON, 'parse')
      const compileSpy = jest.spyOn(Ajv.prototype, 'compile')

      await expect(FileUtil.getJsonFromFile(filePath, {})).rejects.toThrow(error)

      expect(readFileSpy.mock.calls).toEqual([
        [
          filePath,
          {
            encoding: 'utf-8',
          },
        ],
      ])
      expect(jsonParseSpy.mock.calls).toEqual([])
      expect(compileSpy.mock.calls).toEqual([])
    })
    it('throws error if file cannot be parsed as JSON', async () => {
      const filePath = 'jelly.xml'
      const contents = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<foods>',
        '    <breakfasts>',
        '         <breakfast>',
        '             <name>toast</name>',
        '         </breakfast>',
        '    </breakfasts>',
        '</foods>',
      ].join('\n')
      const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValue(contents)
      const jsonParseSpy = jest.spyOn(JSON, 'parse')
      const compileSpy = jest.spyOn(Ajv.prototype, 'compile')

      await expect(FileUtil.getJsonFromFile(filePath, {})).rejects.toThrow(
        `Could not parse file "${filePath}" as JSON: SyntaxError: Unexpected token < in JSON at position 0`
      )

      expect(readFileSpy.mock.calls).toEqual([
        [
          filePath,
          {
            encoding: 'utf-8',
          },
        ],
      ])
      expect(jsonParseSpy.mock.calls).toEqual([[contents]])
      expect(compileSpy.mock.calls).toEqual([])
    })
    it('throws error if file contents do not match Ajv schema', async () => {
      const filePath = 'jelly.xml'
      const contents = JSON.stringify(
        {
          foo: 'bar',
        },
        null,
        2
      )
      interface SchemaTest {
        hello: string
      }
      const schema: JTDSchemaType<SchemaTest> = {
        properties: {
          hello: {
            type: 'string',
          },
        },
      }
      const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValue(contents)
      const jsonParseSpy = jest.spyOn(JSON, 'parse')
      const compileSpy = jest.spyOn(Ajv.prototype, 'compile')

      await expect(FileUtil.getJsonFromFile(filePath, schema)).rejects.toThrow(
        `Invalid "${filePath}" contents: ${JSON.stringify(
          [
            {
              instancePath: '',
              schemaPath: '/properties/hello',
              keyword: 'properties',
              params: {
                error: 'missing',
                missingProperty: 'hello',
              },
              message: "must have property 'hello'",
            },
          ],
          null,
          2
        )}`
      )

      expect(readFileSpy.mock.calls).toEqual([
        [
          filePath,
          {
            encoding: 'utf-8',
          },
        ],
      ])
      expect(jsonParseSpy.mock.calls).toEqual([[contents]])
      expect(compileSpy.mock.calls).toEqual([[schema]])
    })
    it('returns json if file contains JSON with valid Ajv schema', async () => {
      const filePath = 'jelly.xml'
      const json = {
        hello: 'world',
      }
      const contents = JSON.stringify(json, null, 2)
      interface SchemaTest {
        hello: string
      }
      const schema: JTDSchemaType<SchemaTest> = {
        properties: {
          hello: {
            type: 'string',
          },
        },
      }
      const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValue(contents)
      const jsonParseSpy = jest.spyOn(JSON, 'parse')
      const compileSpy = jest.spyOn(Ajv.prototype, 'compile')

      await expect(FileUtil.getJsonFromFile(filePath, schema)).resolves.toEqual(json)

      expect(readFileSpy.mock.calls).toEqual([
        [
          filePath,
          {
            encoding: 'utf-8',
          },
        ],
      ])
      expect(jsonParseSpy.mock.calls).toEqual([[contents]])
      expect(compileSpy.mock.calls).toEqual([[schema]])
    })
  })
})
