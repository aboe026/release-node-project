import Option, { OptionType } from '../../src/option'

describe('Option', () => {
  describe('coercePositiveInteger', () => {
    it('only calls to coercePositiveInt on key if no aliases', () => {
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const key = 'foo'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coercePositiveIntSpy = jest.spyOn(Option as any, 'coercePositiveIntByKey').mockImplementation()

      Option.coercePositiveInteger(
        argv,
        new Option({
          key,
          value: {},
        })
      )

      expect(coercePositiveIntSpy.mock.calls).toEqual([
        [
          {
            argv,
            key,
          },
        ],
      ])
    })
    it('calls to coercePositiveInt on key and single alias', () => {
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const key = 'foo'
      const aliases = ['f']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coercePositiveIntSpy = jest.spyOn(Option as any, 'coercePositiveIntByKey').mockImplementation()

      Option.coercePositiveInteger(
        argv,
        new Option({
          key,
          value: {
            alias: aliases,
          },
        })
      )

      expect(coercePositiveIntSpy.mock.calls).toEqual([
        [
          {
            argv,
            key: aliases[0],
          },
        ],
        [
          {
            argv,
            key,
          },
        ],
      ])
    })
    it('calls to coercePositiveInt on key and multiple alias', () => {
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const key = 'foo'
      const aliases = ['f', 'fo']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coercePositiveIntSpy = jest.spyOn(Option as any, 'coercePositiveIntByKey').mockImplementation()

      Option.coercePositiveInteger(
        argv,
        new Option({
          key,
          value: {
            alias: aliases,
          },
        })
      )

      expect(coercePositiveIntSpy.mock.calls).toEqual([
        [
          {
            argv,
            key: aliases[0],
          },
        ],
        [
          {
            argv,
            key: aliases[1],
          },
        ],
        [
          {
            argv,
            key,
          },
        ],
      ])
    })
  })

  describe('coercePositiveIntByKey', () => {
    it('throws error if value is non numeric string', () => {
      const key = 'foo'
      const value = 'bar'
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('throws error if value is date', () => {
      const key = 'foo'
      const value = new Date()
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('throws error if value is false boolean', () => {
      const key = 'foo'
      const value = false
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('throws error if value is true boolean', () => {
      const key = 'foo'
      const value = true
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('throws error if value is regexp', () => {
      const key = 'foo'
      const value = /^&/
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('throws error if value is not integer', () => {
      const key = 'foo'
      const value = '1.0'
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('throws error if value is not positive', () => {
      const key = 'foo'
      const value = '-1'
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).toThrow(`Invalid value "${value}" for option "${key}", must be positive integer.`)
      expect(argv[key]).toEqual(value)
    })
    it('does not throw error if key empty string', () => {
      const key = ''
      const value = 'bar'
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).not.toThrow()
      expect(argv[key]).toEqual(value)
    })
    it('does not throw error if value undefined', () => {
      const key = 'foo'
      const value = undefined
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).not.toThrow()
      expect(argv[key]).toEqual(value)
    })
    it('transforms value if positive integer string', () => {
      const key = 'foo'
      const value = '1'
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).not.toThrow()
      expect(argv[key]).toEqual(1)
    })
    it('transforms value if positive integer number', () => {
      const key = 'foo'
      const value = 1
      const argv = {
        $0: 'command',
        _: ['non-option'],
        [key]: value,
      }
      expect(() =>
        Option['coercePositiveIntByKey']({
          argv,
          key,
        })
      ).not.toThrow()
      expect(argv[key]).toEqual(value)
    })
  })

  describe('getBooleanValue', () => {
    it('calls out to getValues', () => {
      const value = true
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'boolean',
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getValueSpy = jest.spyOn(Option as any, 'getValues').mockReturnValue([value])
      expect(Option.getBooleanValue(argv, option)).toEqual(value)
      expect(getValueSpy.mock.calls).toEqual([
        [
          {
            argv,
            option,
            type: OptionType.Boolean,
          },
        ],
      ])
    })
  })

  describe('getRequiredStringValue', () => {
    it('throws error if value undefined', () => {
      const value = undefined
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'string',
        },
      })
      const getStringValueSpy = jest.spyOn(Option, 'getStringValue').mockReturnValue(value)

      expect(() => Option.getRequiredStringValue(argv, option)).toThrow(
        `Option "${option.key}" required but was not provided`
      )

      expect(getStringValueSpy.mock.calls).toEqual([[argv, option]])
    })
    it('throws error if value empty string', () => {
      const value = ''
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'string',
        },
      })
      const getStringValueSpy = jest.spyOn(Option, 'getStringValue').mockReturnValue(value)

      expect(() => Option.getRequiredStringValue(argv, option)).toThrow(
        `Option "${option.key}" required but value provided was empty`
      )

      expect(getStringValueSpy.mock.calls).toEqual([[argv, option]])
    })
    it('returns value if not empty', () => {
      const value = 'bar'
      const argv = {
        $0: 'command',
        _: ['non-option'],
        foo: value,
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'string',
        },
      })
      const getStringValueSpy = jest.spyOn(Option, 'getStringValue').mockReturnValue(value)

      expect(Option.getRequiredStringValue(argv, option)).toEqual(value)

      expect(getStringValueSpy.mock.calls).toEqual([[argv, option]])
    })
  })

  describe('getStringValue', () => {
    it('calls out to getValues', () => {
      const value = 'bar'
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'string',
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getValueSpy = jest.spyOn(Option as any, 'getValues').mockReturnValue([value])
      expect(Option.getStringValue(argv, option)).toEqual(value)
      expect(getValueSpy.mock.calls).toEqual([
        [
          {
            argv,
            option,
            type: OptionType.String,
          },
        ],
      ])
    })
  })

  describe('getNumberValue', () => {
    it('calls out to getValues', () => {
      const value = 1
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'number',
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getValueSpy = jest.spyOn(Option as any, 'getValues').mockReturnValue([value])
      expect(Option.getNumberValue(argv, option)).toEqual(value)
      expect(getValueSpy.mock.calls).toEqual([
        [
          {
            argv,
            option,
            type: OptionType.Number,
          },
        ],
      ])
    })
  })

  describe('getStringArrayValues', () => {
    it('calls out to getValues', () => {
      const value = ['bar', 'bat']
      const argv = {
        $0: 'command',
        _: ['non-option'],
      }
      const option = new Option({
        key: 'foo',
        value: {
          type: 'string',
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getValueSpy = jest.spyOn(Option as any, 'getValues').mockReturnValue(value)
      expect(Option.getStringArrayValues(argv, option)).toEqual(value)
      expect(getValueSpy.mock.calls).toEqual([
        [
          {
            argv,
            option,
            type: OptionType.String,
          },
        ],
      ])
    })
  })

  describe('getValues', () => {
    it('calls to addPotentialValues once if no aliases match', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addPotentialValuesSpy = jest.spyOn(Option as any, 'addPotentialValues').mockImplementation()

      expect(
        Option['getValues']({
          argv: {
            $0: 'command',
            _: ['non-option'],
          },
          option: new Option({
            key: 'foo',
            value: {
              type: 'string',
            },
          }),
          type: OptionType.String,
        })
      ).toEqual([])

      expect(addPotentialValuesSpy.mock.calls).toEqual([
        [
          {
            optionName: 'foo',
            values: [],
            potentialValues: undefined,
            type: OptionType.String,
          },
        ],
      ])
    })
    it('calls to addPotentialValues twice if one alias matches', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addPotentialValuesSpy = jest.spyOn(Option as any, 'addPotentialValues').mockImplementation()

      expect(
        Option['getValues']({
          argv: {
            $0: 'command',
            _: ['non-option'],
            f: undefined,
          },
          option: new Option({
            key: 'foo',
            value: {
              type: 'string',
              alias: ['f'],
            },
          }),
          type: OptionType.String,
        })
      ).toEqual([])

      expect(addPotentialValuesSpy.mock.calls).toEqual([
        [
          {
            optionName: 'f',
            values: [],
            potentialValues: undefined,
            type: OptionType.String,
          },
        ],
        [
          {
            optionName: 'foo',
            values: [],
            potentialValues: undefined,
            type: OptionType.String,
          },
        ],
      ])
    })
    it('calls to addPotentialValues thrice if two aliases matches', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addPotentialValuesSpy = jest.spyOn(Option as any, 'addPotentialValues').mockImplementation()

      expect(
        Option['getValues']({
          argv: {
            $0: 'command',
            _: ['non-option'],
            f: undefined,
            fo: undefined,
          },
          option: new Option({
            key: 'foo',
            value: {
              type: 'string',
              alias: ['f', 'fo'],
            },
          }),
          type: OptionType.String,
        })
      ).toEqual([])

      expect(addPotentialValuesSpy.mock.calls).toEqual([
        [
          {
            optionName: 'f',
            values: [],
            potentialValues: undefined,
            type: OptionType.String,
          },
        ],
        [
          {
            optionName: 'fo',
            values: [],
            potentialValues: undefined,
            type: OptionType.String,
          },
        ],
        [
          {
            optionName: 'foo',
            values: [],
            potentialValues: undefined,
            type: OptionType.String,
          },
        ],
      ])
    })
  })

  describe('addPotentialValue', () => {
    describe('string', () => {
      describe('single', () => {
        it('throws error if potentialValue type does not match type', () => {
          expect(() => {
            Option['addPotentialValues']({
              optionName: 'foo',
              values: [],
              potentialValues: true,
              type: OptionType.String,
            })
          }).toThrow(`Invalid type "boolean" for option "foo" with value "true", must be "string"`)
        })
        it('does not add to values if potentialValue undefined', () => {
          const values: string[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: undefined,
            type: OptionType.String,
          })

          expect(values).toEqual([])
        })
        it('adds to values if potentialValue matches type', () => {
          const values: string[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: 'bar',
            type: OptionType.String,
          })

          expect(values).toEqual(['bar'])
        })
        it('does not duplicate values if potentialValue already present', () => {
          const values: string[] = ['bar']

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: 'bar',
            type: OptionType.String,
          })

          expect(values).toEqual(['bar'])
        })
      })
      describe('array', () => {
        it('throws error if potentialValue type does not match type', () => {
          expect(() => {
            Option['addPotentialValues']({
              optionName: 'foo',
              values: [],
              potentialValues: [true],
              type: OptionType.String,
            })
          }).toThrow(`Invalid type "boolean" for option "foo" with value "true", must be "string"`)
        })
        it('does not add to values if potentialValue undefined', () => {
          const values: string[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [undefined],
            type: OptionType.String,
          })

          expect(values).toEqual([])
        })
        it('adds to values if potentialValue matches type', () => {
          const values: string[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: ['bar'],
            type: OptionType.String,
          })

          expect(values).toEqual(['bar'])
        })
        it('does not duplicate values if potentialValue already present', () => {
          const values: string[] = ['bar']

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: ['bar'],
            type: OptionType.String,
          })

          expect(values).toEqual(['bar'])
        })
        it('does not duplicate values if potentialValue contains duplicates of type', () => {
          const values: string[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: ['bar', 'bar'],
            type: OptionType.String,
          })

          expect(values).toEqual(['bar'])
        })
      })
    })
    describe('number', () => {
      describe('single', () => {
        it('throws error if potentialValue type does not match type', () => {
          expect(() => {
            Option['addPotentialValues']({
              optionName: 'foo',
              values: [],
              potentialValues: '1',
              type: OptionType.Number,
            })
          }).toThrow(`Invalid type "string" for option "foo" with value "1", must be "number"`)
        })
        it('does not add to values if potentialValue undefined', () => {
          const values: number[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: undefined,
            type: OptionType.Number,
          })

          expect(values).toEqual([])
        })
        it('adds to values if potentialValue matches type', () => {
          const values: number[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: 1,
            type: OptionType.Number,
          })

          expect(values).toEqual([1])
        })
        it('does not duplicate values if potentialValue already present', () => {
          const values: number[] = [1]

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: 1,
            type: OptionType.Number,
          })

          expect(values).toEqual([1])
        })
      })
      describe('array', () => {
        it('throws error if potentialValue type does not match type', () => {
          expect(() => {
            Option['addPotentialValues']({
              optionName: 'foo',
              values: [],
              potentialValues: ['1'],
              type: OptionType.Number,
            })
          }).toThrow(`Invalid type "string" for option "foo" with value "1", must be "number"`)
        })
        it('does not add to values if potentialValue undefined', () => {
          const values: number[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [undefined],
            type: OptionType.Number,
          })

          expect(values).toEqual([])
        })
        it('adds to values if potentialValue matches type', () => {
          const values: number[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [1],
            type: OptionType.Number,
          })

          expect(values).toEqual([1])
        })
        it('does not duplicate values if potentialValue already present', () => {
          const values: number[] = [1]

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [1],
            type: OptionType.Number,
          })

          expect(values).toEqual([1])
        })
        it('does not duplicate values if potentialValue contains duplicates of type', () => {
          const values: number[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [1, 1],
            type: OptionType.Number,
          })

          expect(values).toEqual([1])
        })
      })
    })
    describe('boolean', () => {
      describe('single', () => {
        it('throws error if potentialValue type does not match type', () => {
          expect(() => {
            Option['addPotentialValues']({
              optionName: 'foo',
              values: [],
              potentialValues: 'true',
              type: OptionType.Boolean,
            })
          }).toThrow(`Invalid type "string" for option "foo" with value "true", must be "boolean"`)
        })
        it('does not add to values if potentialValue undefined', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: undefined,
            type: OptionType.Boolean,
          })

          expect(values).toEqual([])
        })
        it('adds to values if potentialValue true', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: true,
            type: OptionType.Boolean,
          })

          expect(values).toEqual([true])
        })
        it('adds to values if potentialValue false', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: false,
            type: OptionType.Boolean,
          })

          expect(values).toEqual([false])
        })
        it('does not duplicate true if true already present', () => {
          const values: boolean[] = [true]

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: true,
            type: OptionType.Boolean,
          })

          expect(values).toEqual([true])
        })
        it('does not duplicate false if true already present', () => {
          const values: boolean[] = [false]

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: false,
            type: OptionType.Boolean,
          })

          expect(values).toEqual([false])
        })
      })
      describe('array', () => {
        it('throws error if potentialValue type does not match type', () => {
          expect(() => {
            Option['addPotentialValues']({
              optionName: 'foo',
              values: [],
              potentialValues: ['true'],
              type: OptionType.Boolean,
            })
          }).toThrow(`Invalid type "string" for option "foo" with value "true", must be "boolean"`)
        })
        it('does not add to values if potentialValue undefined', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [undefined],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([])
        })
        it('adds to values if potentialValue true', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [true],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([true])
        })
        it('adds to values if potentialValue false', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [false],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([false])
        })
        it('does not duplicate true if true already present', () => {
          const values: boolean[] = [true]

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [true],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([true])
        })
        it('does not duplicate false if true already present', () => {
          const values: boolean[] = [false]

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [false],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([false])
        })
        it('does not duplicate true if potentialValue contains duplicates of true', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [true, true],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([true])
        })
        it('does not duplicate false if potentialValue contains duplicates of false', () => {
          const values: boolean[] = []

          Option['addPotentialValues']({
            optionName: 'foo',
            values,
            potentialValues: [false, false],
            type: OptionType.Boolean,
          })

          expect(values).toEqual([false])
        })
      })
    })
  })
})
