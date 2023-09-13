import { JTDSchemaType } from 'ajv/dist/jtd'
import { Arguments, Argv, CommandModule } from 'yargs'
import { schema as ReleaseNotesSchema } from './release-note'

import FileUtil from './file-util'
import Option from './option'

/**
 * Class for linting release notes for an NPM module
 */
export default class LintReleaseNotes {
  /**
   * The options available for this command
   */
  static readonly options = {
    NotesFile: new Option({
      key: 'notes-file',
      value: {
        alias: ['notes', 'n'],
        description: 'A path to the file exporting release notes to lint',
        type: 'string',
        default: 'release-notes.json',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    PackageFile: new Option({
      key: 'package-file',
      value: {
        alias: ['package', 'p'],
        description: 'A path to the package.json file for the module to lint',
        type: 'string',
        default: 'package.json',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
  }

  /**
   * Gets the command for use by the CLI
   *
   * @returns The command to be used by Yargs for CLI interpretation
   */
  static getCommand(): CommandModule {
    return {
      command: ['lint-release-notes'],
      aliases: ['lint'],
      describe: 'Lint the release notes for an NPM module.',
      builder: (yargs: Argv) =>
        yargs
          .option(LintReleaseNotes.options.NotesFile.key, LintReleaseNotes.options.NotesFile.value)
          .option(LintReleaseNotes.options.PackageFile.key, LintReleaseNotes.options.PackageFile.value),
      handler: async (argv: Arguments) => {
        const notesFile = Option.getStringValue(argv, LintReleaseNotes.options.NotesFile)
        const packageJsonFile = Option.getStringValue(argv, LintReleaseNotes.options.PackageFile)

        const notesFilePath = await FileUtil.validateFile(notesFile, LintReleaseNotes.options.NotesFile.key)
        const packageJsonFilePath = await FileUtil.validateFile(
          packageJsonFile,
          LintReleaseNotes.options.PackageFile.key
        )

        await LintReleaseNotes.lint(notesFilePath, packageJsonFilePath)
      },
    }
  }

  /**
   * Ensures there are not problems with the release notes file
   *
   * @param notesFilePath The path on the system which exports the release notes array
   * @param packageJsonFilePath The path on the system of the package.json file
   */
  static async lint(notesFilePath: string, packageJsonFilePath: string) {
    const releaseNotes = await FileUtil.getJsonFromFile(notesFilePath, ReleaseNotesSchema)
    const { version } = await FileUtil.getJsonFromFile(packageJsonFilePath, PackageJsonSchema)

    let notesFound = false
    for (const note of releaseNotes) {
      if (note.version === version) {
        notesFound = true
      }
    }
    if (!notesFound) {
      throw Error(`No release note found for version "${version}" in file "${notesFilePath}"`)
    }
    console.log('Release notes valid :)')
  }
}

/**
 * Representation of the contents of a package.json file
 */
export interface PackageJson {
  /** The version of the npm project */
  version: string
}

/**
 * How to validate package.json contents from raw JSON
 */
export const PackageJsonSchema: JTDSchemaType<PackageJson> = {
  additionalProperties: true,
  properties: {
    version: {
      type: 'string',
    },
  },
}
