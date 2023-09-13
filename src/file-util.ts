import Ajv, { JTDSchemaType } from 'ajv/dist/jtd'
import fs from 'fs/promises'
import path from 'path'

/**
 * Class for interacting with Files
 */
export default class FileUtil {
  /**
   * Ensures a file exists and is accessible
   *
   * @param filePath The system path to a file, made absolute to the process working directory if relative
   * @param optionKey The name of the flag/argument/option the file corresponds to
   * @returns The absolute path to the file
   */
  static async validateFile(filePath: string | undefined, optionKey: string): Promise<string> {
    if (!filePath) {
      throw Error(`Option "${optionKey}" required but not provided.`)
    }
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath)
    }
    try {
      await fs.access(filePath)
    } catch (err: unknown) {
      throw Error(`Could not access file "${filePath}": ${err}`)
    }
    return filePath
  }

  /**
   * Reads content of a file and returns its JSON representation as defined by an Ajv schema
   *
   * @param filePath The system path to a file
   * @param schema The Ajv JSON schema to validate the file contents against and type the returned object with
   * @returns The JSON representation of the file contents, typed as defined by the Ajv schema
   */
  static async getJsonFromFile<T>(filePath: string, schema: JTDSchemaType<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents: any = await fs.readFile(filePath, {
      encoding: 'utf-8',
    })
    let json: any // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      json = JSON.parse(contents)
    } catch (err: unknown) {
      throw Error(`Could not parse file "${filePath}" as JSON: ${err}`)
    }

    const ajv = new Ajv()
    const validate = ajv.compile(schema)
    if (!validate(json)) {
      throw Error(`Invalid "${filePath}" contents: ${JSON.stringify(validate.errors, null, 2)}`)
    }

    return json
  }
}
