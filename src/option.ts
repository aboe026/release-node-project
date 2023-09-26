import { Arguments, Options } from 'yargs'

/**
 * Class for CLI options/flags/arguments
 */
export default class Option {
  readonly key: string
  readonly value: Options

  constructor({ key, value }: { key: string; value: Options }) {
    this.key = key
    this.value = value
  }

  /**
   * Ensure values provided for Option are positive integers and type cast them as such
   *
   * @param argv The arguments provided to the CLI
   * @param option The option/flag/argument to validate as and convert to a positive integer
   */
  static coercePositiveInteger(argv: Arguments, option: Option) {
    if (option.value.alias) {
      for (const alias of option.value.alias) {
        Option.coercePositiveIntByKey({
          argv,
          key: alias,
        })
      }
    }
    Option.coercePositiveIntByKey({
      argv,
      key: option.key,
    })
  }

  /**
   * Ensure value provided for key is positive integer and type case it as such
   *
   * @param params The arguments provided to the CLI and The option/flag/argument to validate as and convert to a positive integer
   */
  private static coercePositiveIntByKey({ argv, key }: { argv: Arguments; key: string }) {
    if (key) {
      const value = argv[key]
      if (value !== undefined) {
        if ((value as string).toString().match(/^\d+$/g)) {
          argv[key] = Number(value)
        } else {
          throw Error(`Invalid value "${value}" for option "${key}", must be positive integer.`)
        }
      }
    }
  }

  /**
   * Get potential value of boolean CLI option
   *
   * @param argv The arguments provided to the CLI
   * @param option The option/flag/argument to get the value of
   * @returns The value of the option as a boolean
   */
  static getBooleanValue(argv: Arguments, option: Option): boolean | undefined {
    return Option.getValues<boolean>({
      argv,
      option,
      type: OptionType.Boolean,
    })[0]
  }

  /**
   * Get value of string CLI option, throw Error if not provided
   *
   * @param argv The arguments provided to the CLI
   * @param option The option/flag/argument to get the value of
   * @returns The value of the option as a string, throw Error if not provided
   */
  static getRequiredStringValue(argv: Arguments, option: Option): string {
    const value = Option.getStringValue(argv, option)
    if (!value) {
      throw Error(
        `Option "${option.key}" required but ${value === undefined ? 'was not provided' : 'value provided was empty'}`
      )
    }
    return value
  }

  /**
   * Get potential value of string CLI option
   *
   * @param argv The arguments provided to the CLI
   * @param option The option/flag/argument to get the value of
   * @returns The value of the option as a string
   */
  static getStringValue(argv: Arguments, option: Option): string | undefined {
    return Option.getValues<string>({
      argv,
      option,
      type: OptionType.String,
    })[0]
  }

  static getNumberValue(argv: Arguments, option: Option): number | undefined {
    return Option.getValues<number>({
      argv,
      option,
      type: OptionType.Number,
    })[0]
  }

  /**
   * Get potential values of string array CLI option
   *
   * @param argv The arguments provided to the CLI
   * @param option The option/flag/argument to get the value of
   * @returns The values for the option as an array of strings
   */
  static getStringArrayValues(argv: Arguments, option: Option): string[] | undefined {
    return Option.getValues<string>({
      argv,
      option,
      type: OptionType.String,
    })
  }

  /**
   * Get potential value for a CLI option
   *
   * @param params An object containing method parameters
   * @returns The value for the option of type defined by the Generic
   */
  private static getValues<Type>({ argv, option, type }: GetValueParams): Type[] {
    const values: Type[] = []
    if (option.value.alias) {
      for (const alias of option.value.alias) {
        Option.addPotentialValues({
          optionName: alias,
          values,
          potentialValues: argv[alias],
          type,
        })
      }
    }
    Option.addPotentialValues({
      optionName: option.key,
      values,
      potentialValues: argv[option.key],
      type,
    })
    return values
  }

  /**
   * Adds potentials values got the values array passed in, given they match the type and are not undefined
   *
   * @param params An object containing method parameters
   */
  private static addPotentialValues<Type>({
    optionName,
    values,
    potentialValues,
    type,
  }: {
    optionName: string
    values: Type[]
    potentialValues: any // eslint-disable-line @typescript-eslint/no-explicit-any
    type: OptionType
  }) {
    if (!Array.isArray(potentialValues)) {
      potentialValues = [potentialValues]
    }
    for (const potentialValue of potentialValues) {
      if (potentialValue !== undefined) {
        if (typeof potentialValue === type) {
          if (!values.includes(potentialValue as Type)) {
            values.push(potentialValue as Type)
          }
        } else {
          throw Error(
            `Invalid type "${typeof potentialValue}" for option "${optionName}" with value "${potentialValue}", must be "${type}"`
          )
        }
      }
    }
  }
}

interface GetValueParams {
  /** Arguments provided to CLI */
  argv: Arguments
  /** Option/flag/argument to get value for */
  option: Option
  /** The type of the option */
  type: OptionType
}

/**
 * The type the Option accepts and should be treated as
 */
export enum OptionType {
  /** A boolean value, either true or false */
  Boolean = 'boolean',
  /** A string value, can be empty */
  String = 'string',
  /** A numeric value, can be float or integer */
  Number = 'number',
}
