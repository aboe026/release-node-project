import yargs, { Arguments, Argv } from 'yargs'

import LintReleaseNotes, { PackageJson, PackageJsonSchema } from '../../src/lint-release-notes'
import Option from '../../src/option'
import ReleaseNote, { schema as ReleaseNotesSchema } from '../../src/release-note'
import FileUtil from '../../src/file-util'

describe('Lint Release Notes', () => {
  describe('getCommand', () => {
    it('builder adds notes and package options', () => {
      const optionSpy = jest.spyOn(yargs, 'option').mockReturnValue(yargs)

      const builder = LintReleaseNotes.getCommand().builder as (yargs: Argv) => Argv
      builder(yargs)

      expect(optionSpy.mock.calls).toEqual([
        [LintReleaseNotes.options.NotesFile.key, LintReleaseNotes.options.NotesFile.value],
        [LintReleaseNotes.options.PackageFile.key, LintReleaseNotes.options.PackageFile.value],
        [LintReleaseNotes.options.StripSuffix.key, LintReleaseNotes.options.StripSuffix.value],
      ])
    })
    it('handler calls to lint', async () => {
      const notesFileName = 'custom-notes.json'
      const packageFileName = 'custom-package.json'
      const notesFilePath = `/path/to/${notesFileName}`
      const packageFilePath = `/my/${packageFileName}`
      const getStringValueSpy = jest
        .spyOn(Option, 'getStringValue')
        .mockReturnValueOnce(notesFileName)
        .mockReturnValueOnce(packageFileName)
      const getBooleanValueSpy = jest.spyOn(Option, 'getBooleanValue').mockReturnValue(false)
      const validateFileSpy = jest
        .spyOn(FileUtil, 'validateFile')
        .mockResolvedValueOnce(notesFilePath)
        .mockResolvedValueOnce(packageFilePath)
      const lintSpy = jest.spyOn(LintReleaseNotes, 'lint').mockResolvedValue()

      const handler = LintReleaseNotes.getCommand().handler as (args: Arguments) => void
      await handler(await yargs.argv)

      expect(getStringValueSpy.mock.calls).toEqual([
        [yargs.argv, LintReleaseNotes.options.NotesFile],
        [yargs.argv, LintReleaseNotes.options.PackageFile],
      ])
      expect(getBooleanValueSpy.mock.calls).toEqual([[yargs.argv, LintReleaseNotes.options.StripSuffix]])
      expect(validateFileSpy.mock.calls).toEqual([
        [notesFileName, LintReleaseNotes.options.NotesFile.key],
        [packageFileName, LintReleaseNotes.options.PackageFile.key],
      ])
      expect(lintSpy.mock.calls).toEqual([[notesFilePath, packageFilePath, false]])
    })
  })

  describe('lint', () => {
    it('throws error if stripSuffix true and invalid semver in package json', async () => {
      const notesPath = 'custom-notes.json'
      const packagePath = 'custom-package.json'
      const notes: ReleaseNote[] = [
        {
          version: '1.0.0',
        },
      ]
      const packageJson: PackageJson = {
        version: 'toast',
      }
      const getJsonFromFileSpy = jest
        .spyOn(FileUtil, 'getJsonFromFile')
        .mockResolvedValueOnce(notes)
        .mockResolvedValueOnce(packageJson)

      await expect(LintReleaseNotes.lint(notesPath, packagePath, true)).rejects.toThrow(
        `Invalid version "${packageJson.version}" found in "${packagePath}": Not a valid semantic version`
      )

      expect(getJsonFromFileSpy.mock.calls).toEqual([
        [notesPath, ReleaseNotesSchema],
        [packagePath, PackageJsonSchema],
      ])
    })
    it('throws error if no release note found for package version', async () => {
      const notesPath = 'custom-notes.json'
      const packagePath = 'custom-package.json'
      const notes: ReleaseNote[] = [
        {
          version: '1.0.0',
        },
      ]
      const packageJson: PackageJson = {
        version: '2.0.0',
      }
      const getJsonFromFileSpy = jest
        .spyOn(FileUtil, 'getJsonFromFile')
        .mockResolvedValueOnce(notes)
        .mockResolvedValueOnce(packageJson)

      await expect(LintReleaseNotes.lint(notesPath, packagePath)).rejects.toThrow(
        `No release note found for version "${packageJson.version}" in file "${notesPath}"`
      )

      expect(getJsonFromFileSpy.mock.calls).toEqual([
        [notesPath, ReleaseNotesSchema],
        [packagePath, PackageJsonSchema],
      ])
    })
    it('prints success message if package version exists as only release in notes', async () => {
      const notesPath = 'custom-notes.json'
      const packagePath = 'custom-package.json'
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const packageJson: PackageJson = {
        version,
      }
      const getJsonFromFileSpy = jest
        .spyOn(FileUtil, 'getJsonFromFile')
        .mockResolvedValueOnce(notes)
        .mockResolvedValueOnce(packageJson)
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      await expect(LintReleaseNotes.lint(notesPath, packagePath)).resolves.toEqual(undefined)

      expect(getJsonFromFileSpy.mock.calls).toEqual([
        [notesPath, ReleaseNotesSchema],
        [packagePath, PackageJsonSchema],
      ])
      expect(consoleLogSpy.mock.calls).toEqual([['Release notes valid :)']])
    })
    it('prints success message if package version exists as one of many releases in notes', async () => {
      const notesPath = 'custom-notes.json'
      const packagePath = 'custom-package.json'
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version: '2.0.0',
        },
        {
          version,
        },
      ]
      const packageJson: PackageJson = {
        version,
      }
      const getJsonFromFileSpy = jest
        .spyOn(FileUtil, 'getJsonFromFile')
        .mockResolvedValueOnce(notes)
        .mockResolvedValueOnce(packageJson)
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      await expect(LintReleaseNotes.lint(notesPath, packagePath)).resolves.toEqual(undefined)

      expect(getJsonFromFileSpy.mock.calls).toEqual([
        [notesPath, ReleaseNotesSchema],
        [packagePath, PackageJsonSchema],
      ])
      expect(consoleLogSpy.mock.calls).toEqual([['Release notes valid :)']])
    })
    it('prints success message if package version needs suffix stripped', async () => {
      const notesPath = 'custom-notes.json'
      const packagePath = 'custom-package.json'
      const version = '1.0.0-1'
      const notes: ReleaseNote[] = [
        {
          version: '1.0.0',
        },
      ]
      const packageJson: PackageJson = {
        version,
      }
      const getJsonFromFileSpy = jest
        .spyOn(FileUtil, 'getJsonFromFile')
        .mockResolvedValueOnce(notes)
        .mockResolvedValueOnce(packageJson)
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      await expect(LintReleaseNotes.lint(notesPath, packagePath, true)).resolves.toEqual(undefined)

      expect(getJsonFromFileSpy.mock.calls).toEqual([
        [notesPath, ReleaseNotesSchema],
        [packagePath, PackageJsonSchema],
      ])
      expect(consoleLogSpy.mock.calls).toEqual([
        [
          `Removing suffixes from package.json version "${version}" to be just "${notes[0].version}" due to "strip-suffix" option value of "true"`,
        ],
        ['Release notes valid :)'],
      ])
    })
  })
})
