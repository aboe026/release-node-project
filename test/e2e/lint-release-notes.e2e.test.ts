import { exec } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { promisify } from 'util'

import { E2eTests, getTestName } from './util/e2e-test-info'
import { PackageTarballPath } from './util/constants'
import ReleaseNote from '../../src/release-note'

const execa = promisify(exec)

describe('Lint Release Notes', () => {
  describe('invalid', () => {
    it('throws error if implicit release notes file does not exist', async () => {
      await createPackageJson('1.0.0')
      await testLint({
        error: `Could not access file \\"${path
          .join(E2eTests[getTestName()].directory, 'release-notes.json')
          .replace(/\\/g, '\\\\')}\\": Error: ENOENT: no such file or directory`,
      })
    })
    it('throws error if explicit release notes file does not exist', async () => {
      const file = 'notes.json'
      await createPackageJson('1.0.0')
      await testLint({
        options: `--notes="${file}"`,
        error: `Could not access file \\"${path
          .join(E2eTests[getTestName()].directory, file)
          .replace(/\\/g, '\\\\')}\\": Error: ENOENT: no such file or directory`,
      })
    })
    it('throws error if explicit package json file does not exist', async () => {
      const file = 'packager.json'
      await createPackageJson('1.0.0')
      await createReleaseNotes([
        {
          version: '1.0.0',
          description: 'lorem ipsum',
          breaking: ['To shreds you say?'],
          features: ['Now featuring...'],
          fixes: ['I can fix that.'],
        },
      ])
      await testLint({
        options: `--package="${file}"`,
        error: `Could not access file \\"${path
          .join(E2eTests[getTestName()].directory, file)
          .replace(/\\/g, '\\\\')}\\": Error: ENOENT: no such file or directory`,
      })
    })
    it('throws error if release notes contain invalid JSON', async () => {
      await createPackageJson('1.0.0')
      await fs.writeFile(path.join(E2eTests[getTestName()].directory, 'release-notes.json'), 'toast')
      await testLint({
        error: `Could not parse file \\"${path
          .join(E2eTests[getTestName()].directory, 'release-notes.json')
          .replace(/\\/g, '\\\\')}\\" as JSON: SyntaxError: Unexpected token o in JSON at position 1`,
      })
    })
    it('throws error if package json contains invalid JSON', async () => {
      await createPackageJson('1.0.0')
      await createReleaseNotes([
        {
          version: '1.0.0',
          description: 'lorem ipsum',
          breaking: ['To shreds you say?'],
          features: ['Now featuring...'],
          fixes: ['I can fix that.'],
        },
      ])
      const filePath = path.join(E2eTests[getTestName()].directory, 'different-package.json')
      await fs.writeFile(filePath, 'toast')
      await testLint({
        options: `--package="${filePath}"`,
        error: `Could not parse file \\"${filePath.replace(
          /\\/g,
          '\\\\'
        )}\\" as JSON: SyntaxError: Unexpected token o in JSON at position 1`,
      })
    })
    it('throws error if release notes does not contain version', async () => {
      await createPackageJson('1.0.0')
      const releaseNotesPath = path.join(E2eTests[getTestName()].directory, 'release-notes.json')
      await fs.writeFile(
        releaseNotesPath,
        JSON.stringify([
          {
            description: 'lorem ipsum',
            breaking: ['To shreds you say?'],
            features: ['Now featuring...'],
            fixes: ['I can fix that.'],
          },
        ])
      )
      await testLint({
        error: `Invalid \\"${releaseNotesPath.replace(
          /\\/g,
          '\\\\'
        )}\\" contents:(.|\n)*\\"message\\": \\"must have property 'version'\\"`,
      })
    })
    it('throws error if package json does not contain version', async () => {
      await createPackageJson('1.0.0')
      const packageJsonPath = path.join(E2eTests[getTestName()].directory, 'package.json')
      const packageJson = (await fs.readJSON(packageJsonPath, {
        encoding: 'utf-8',
      })) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      delete packageJson.version
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
      await createReleaseNotes([
        {
          version: '1.0.0',
          description: 'lorem ipsum',
          breaking: ['To shreds you say?'],
          features: ['Now featuring...'],
          fixes: ['I can fix that.'],
        },
      ])
      await testLint({
        error: `Invalid \\"${path
          .join(E2eTests[getTestName()].directory, 'package.json')
          .replace(/\\/g, '\\\\')}\\" contents:(.|\n)*\\"message\\": \\"must have property 'version'\\"`,
      })
    })
    it('throws error if release notes does not contain entry for package json version', async () => {
      const version = '2.0.0'
      await createPackageJson(version)
      await createReleaseNotes([
        {
          version: '1.0.0',
          description: 'lorem ipsum',
          breaking: ['To shreds you say?'],
          features: ['Now featuring...'],
          fixes: ['I can fix that.'],
        },
      ])
      await testLint({
        error: `No release note found for version "${version}" in file "${path
          .join(E2eTests[getTestName()].directory, 'release-notes.json')
          .replace(/\\/g, '\\\\')}"`,
      })
    })
  })
  describe('valid', () => {
    describe('implicit', () => {
      it('exits successfully with single release with required types', async () => {
        const version = '1.0.0'
        await createPackageJson(version)
        await createReleaseNotes([
          {
            version,
          },
        ])
        await testLint({})
      })
      it('exits successfully with single release with all types', async () => {
        const version = '1.0.0'
        await createPackageJson(version)
        await createReleaseNotes([
          {
            version,
            description: 'lorem ipsum',
            breaking: ['To shreds you say?'],
            features: ['Now featuring...'],
            fixes: ['I can fix that.'],
          },
        ])
        await testLint({})
      })
      it('exits successfully with multiple releases with all types', async () => {
        const version = '2.0.0'
        await createPackageJson(version)
        await createReleaseNotes([
          {
            version,
            description: 'lorem ipsum',
            breaking: ['To shreds you say?'],
            features: ['Now featuring...'],
            fixes: ['I can fix that.'],
          },
          {
            version: '1.0.0',
            description: 'hello world',
            breaking: ['total eclipse'],
            features: ['live from'],
            fixes: ['duct tape'],
          },
        ])
        await testLint({})
      })
    })
    describe('explicit', () => {
      const subDir = 'subdir'
      const releaseNotesFileName = 'notes.json'
      it('exits successfully with single release with required types', async () => {
        const version = '1.0.0'
        await createPackageJson(version)
        await createReleaseNotes(
          [
            {
              version,
            },
          ],
          releaseNotesFileName,
          subDir
        )
        await testLint({
          options: `--notes="${path.join(
            E2eTests[getTestName()].directory,
            subDir,
            releaseNotesFileName
          )}" --package="${path.join(E2eTests[getTestName()].directory, 'package.json')}"`,
        })
      })
      it('exits successfully with single release with all types', async () => {
        const version = '1.0.0'
        await createPackageJson(version)
        await createReleaseNotes(
          [
            {
              version,
              description: 'lorem ipsum',
              breaking: ['To shreds you say?'],
              features: ['Now featuring...'],
              fixes: ['I can fix that.'],
            },
          ],
          releaseNotesFileName,
          subDir
        )
        await testLint({
          options: `--notes="${path.join(
            E2eTests[getTestName()].directory,
            subDir,
            releaseNotesFileName
          )}" --package="${path.join(E2eTests[getTestName()].directory, 'package.json')}"`,
        })
      })
      it('exits successfully with multiple releases with all types', async () => {
        const version = '2.0.0'
        await createPackageJson(version)
        await createReleaseNotes(
          [
            {
              version,
              description: 'lorem ipsum',
              breaking: ['To shreds you say?'],
              features: ['Now featuring...'],
              fixes: ['I can fix that.'],
            },
            {
              version: '1.0.0',
              description: 'hello world',
              breaking: ['total eclipse'],
              features: ['live from'],
              fixes: ['duct tape'],
            },
          ],
          releaseNotesFileName,
          subDir
        )
        await testLint({
          options: `--notes="${path.join(
            E2eTests[getTestName()].directory,
            subDir,
            releaseNotesFileName
          )}" --package="${path.join(E2eTests[getTestName()].directory, 'package.json')}"`,
        })
      })
    })
  })
})

async function createPackageJson(version: string) {
  const directory = E2eTests[getTestName()].directory
  const packageJsonPath = path.join(directory, 'package.json')
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        version,
        scripts: {
          lint: 'release-node-project lint',
        },
        devDependencies: {
          'release-node-project': `file:${PackageTarballPath}`,
        },
      },
      null,
      2
    )
  )
  await execa('npm install', {
    cwd: directory,
  })
}

async function createReleaseNotes(notes: ReleaseNote[], fileName = 'release-notes.json', subDirectory?: string) {
  let directory = E2eTests[getTestName()].directory
  if (subDirectory) {
    directory = path.join(directory, subDirectory)
    await fs.ensureDir(directory)
  }
  const releaseNotesPath = path.join(directory, fileName)
  await fs.ensureDir(path.dirname(releaseNotesPath))
  await fs.writeFile(releaseNotesPath, JSON.stringify(notes, null, 2))
}

async function testLint({ options, error }: { options?: string; error?: string }) {
  const directory = E2eTests[getTestName()].directory
  const promise = execa(`npm run lint${options ? ` -- ${options}` : ''}`, {
    cwd: directory,
  })
  if (error) {
    await expect(promise).rejects.toThrow(new RegExp(`.*Error: ${error}.*`))
  } else {
    await expect(promise).resolves.toEqual({
      stderr: '',
      stdout: [
        '',
        '> lint',
        `> release-node-project lint${options ? ` ${options.replace(/"/g, '')}` : ''}`,
        '',
        'Release notes valid :)',
        '',
      ].join('\n'),
    })
  }
}
