import fs from 'fs/promises'
import { Octokit } from '@octokit/rest'
import yargs, { Arguments, Argv } from 'yargs'

import Option from '../../src/option'
import ReleaseGitHub from '../../src/release-github'
import ReleaseNote, { schema as ReleaseNoteSchema } from '../../src/release-note'
import FileUtil from '../../src/file-util'

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => {
      return {}
    }),
  }
})

describe('Release GitHub', () => {
  describe('getCommand', () => {
    it('builder adds options, disables version and adds check', () => {
      const optionSpy = jest.spyOn(yargs, 'option').mockReturnValue(yargs)
      const versionSpy = jest.spyOn(yargs, 'version').mockReturnValue(yargs)
      const checkSpy = jest.spyOn(yargs, 'check').mockReturnValue(yargs)

      const builder = ReleaseGitHub.getCommand().builder as (yargs: Argv) => Argv
      builder(yargs)

      expect(optionSpy.mock.calls).toEqual([
        [ReleaseGitHub.options.Artifacts.key, ReleaseGitHub.options.Artifacts.value],
        [ReleaseGitHub.options.AuthToken.key, ReleaseGitHub.options.AuthToken.value],
        [ReleaseGitHub.options.BuildBranch.key, ReleaseGitHub.options.BuildBranch.value],
        [ReleaseGitHub.options.BuildNumber.key, ReleaseGitHub.options.BuildNumber.value],
        [ReleaseGitHub.options.Draft.key, ReleaseGitHub.options.Draft.value],
        [ReleaseGitHub.options.ApiUrl.key, ReleaseGitHub.options.ApiUrl.value],
        [ReleaseGitHub.options.ReleaseNotes.key, ReleaseGitHub.options.ReleaseNotes.value],
        [ReleaseGitHub.options.Owner.key, ReleaseGitHub.options.Owner.value],
        [ReleaseGitHub.options.Repo.key, ReleaseGitHub.options.Repo.value],
        [ReleaseGitHub.options.TagAsLatest.key, ReleaseGitHub.options.TagAsLatest.value],
        [ReleaseGitHub.options.Target.key, ReleaseGitHub.options.Target.value],
        [ReleaseGitHub.options.UploadUrl.key, ReleaseGitHub.options.UploadUrl.value],
        [ReleaseGitHub.options.Version.key, ReleaseGitHub.options.Version.value],
      ])
      expect(versionSpy.mock.calls).toEqual([[false]])
      expect(checkSpy.mock.calls).toEqual([[ReleaseGitHub['validateArguments']]])
    })
    it('handler calls to createRelease with required fields', async () => {
      const artifacts = undefined
      const authToken = '1234'
      const buildBranch = undefined
      const buildNumber = undefined
      const draft = undefined
      const apiUrl = 'https://custom.domain:443'
      const notesFile = 'custom-notes.json'
      const owner = 'proprietor'
      const repo = 'sales'
      const tagAsLatest = undefined
      const target = undefined
      const uploadUrl = 'https://custom.upload:8443'
      const version = '1.0.0'
      const notesFilePath = `/path/to/${notesFile}`
      const releaseNotes = [
        {
          version: '1.0.0',
        },
      ]
      const getStringArrayValuesSpy = jest.spyOn(Option, 'getStringArrayValues').mockReturnValue(artifacts)
      const getStringValueSpy = jest
        .spyOn(Option, 'getStringValue')
        .mockReturnValueOnce(authToken)
        .mockReturnValueOnce(buildBranch)
        .mockReturnValueOnce(apiUrl)
        .mockReturnValueOnce(notesFile)
        .mockReturnValueOnce(owner)
        .mockReturnValueOnce(repo)
        .mockReturnValueOnce(target)
        .mockReturnValueOnce(uploadUrl)
        .mockReturnValueOnce(version)
      const getNumberValueSpy = jest.spyOn(Option, 'getNumberValue').mockReturnValueOnce(buildNumber)
      const getBooleanValueSpy = jest
        .spyOn(Option, 'getBooleanValue')
        .mockReturnValueOnce(draft)
        .mockReturnValueOnce(tagAsLatest)
      const validateFileSpy = jest.spyOn(FileUtil, 'validateFile').mockResolvedValueOnce(notesFilePath)
      const getJsonFromFileSpy = jest.spyOn(FileUtil, 'getJsonFromFile').mockResolvedValue(releaseNotes)
      const createReleaseSpy = jest.spyOn(ReleaseGitHub, 'createRelease').mockResolvedValue()

      const handler = ReleaseGitHub.getCommand().handler as (args: Arguments) => void
      await handler(await yargs.argv)

      expect(getStringArrayValuesSpy.mock.calls).toEqual([[yargs.argv, ReleaseGitHub.options.Artifacts]])
      expect(getStringValueSpy.mock.calls).toEqual([
        [yargs.argv, ReleaseGitHub.options.AuthToken],
        [yargs.argv, ReleaseGitHub.options.BuildBranch],
        [yargs.argv, ReleaseGitHub.options.ApiUrl],
        [yargs.argv, ReleaseGitHub.options.ReleaseNotes],
        [yargs.argv, ReleaseGitHub.options.Owner],
        [yargs.argv, ReleaseGitHub.options.Repo],
        [yargs.argv, ReleaseGitHub.options.Target],
        [yargs.argv, ReleaseGitHub.options.UploadUrl],
        [yargs.argv, ReleaseGitHub.options.Version],
      ])
      expect(getNumberValueSpy.mock.calls).toEqual([[yargs.argv, ReleaseGitHub.options.BuildNumber]])
      expect(getBooleanValueSpy.mock.calls).toEqual([
        [yargs.argv, ReleaseGitHub.options.Draft],
        [yargs.argv, ReleaseGitHub.options.TagAsLatest],
      ])
      expect(validateFileSpy.mock.calls).toEqual([[notesFile, ReleaseGitHub.options.ReleaseNotes.key]])
      expect(getJsonFromFileSpy.mock.calls).toEqual([[notesFilePath, ReleaseNoteSchema]])
      expect(createReleaseSpy.mock.calls).toEqual([
        [
          {
            apiUrl,
            artifactPaths: [],
            authToken,
            branch: buildBranch,
            draft,
            latest: tagAsLatest,
            notes: releaseNotes,
            number: buildNumber,
            owner,
            repo,
            target,
            uploadUrl,
            version,
          },
        ],
      ])
    })
    it('handler calls to createRelease with optional fields', async () => {
      const artifacts = ['test.txt', 'temp.zip']
      const authToken = '1234'
      const buildBranch = '1.0'
      const buildNumber = 1
      const draft = true
      const apiUrl = 'https://custom.domain:443'
      const notesFile = 'custom-notes.json'
      const owner = 'proprietor'
      const repo = 'sales'
      const tagAsLatest = false
      const target = '1.0'
      const uploadUrl = 'https://custom.upload:8443'
      const version = '1.0.0'
      const notesFilePath = `/path/to/${notesFile}`
      const releaseNotes = [
        {
          version: '1.0.0',
        },
      ]
      const artifactPaths = [`/files/${artifacts[0]}`, `/tmp/${artifacts[1]}`]
      const getStringArrayValuesSpy = jest.spyOn(Option, 'getStringArrayValues').mockReturnValue(artifacts)
      const getStringValueSpy = jest
        .spyOn(Option, 'getStringValue')
        .mockReturnValueOnce(authToken)
        .mockReturnValueOnce(buildBranch)
        .mockReturnValueOnce(apiUrl)
        .mockReturnValueOnce(notesFile)
        .mockReturnValueOnce(owner)
        .mockReturnValueOnce(repo)
        .mockReturnValueOnce(target)
        .mockReturnValueOnce(uploadUrl)
        .mockReturnValueOnce(version)
      const getNumberValueSpy = jest.spyOn(Option, 'getNumberValue').mockReturnValueOnce(buildNumber)
      const getBooleanValueSpy = jest
        .spyOn(Option, 'getBooleanValue')
        .mockReturnValueOnce(draft)
        .mockReturnValueOnce(tagAsLatest)
      const validateFileSpy = jest
        .spyOn(FileUtil, 'validateFile')
        .mockResolvedValueOnce(notesFilePath)
        .mockResolvedValueOnce(artifactPaths[0])
        .mockResolvedValueOnce(artifactPaths[1])
      const getJsonFromFileSpy = jest.spyOn(FileUtil, 'getJsonFromFile').mockResolvedValue(releaseNotes)
      const createReleaseSpy = jest.spyOn(ReleaseGitHub, 'createRelease').mockResolvedValue()

      const handler = ReleaseGitHub.getCommand().handler as (args: Arguments) => void
      await handler(await yargs.argv)

      expect(getStringArrayValuesSpy.mock.calls).toEqual([[yargs.argv, ReleaseGitHub.options.Artifacts]])
      expect(getStringValueSpy.mock.calls).toEqual([
        [yargs.argv, ReleaseGitHub.options.AuthToken],
        [yargs.argv, ReleaseGitHub.options.BuildBranch],
        [yargs.argv, ReleaseGitHub.options.ApiUrl],
        [yargs.argv, ReleaseGitHub.options.ReleaseNotes],
        [yargs.argv, ReleaseGitHub.options.Owner],
        [yargs.argv, ReleaseGitHub.options.Repo],
        [yargs.argv, ReleaseGitHub.options.Target],
        [yargs.argv, ReleaseGitHub.options.UploadUrl],
        [yargs.argv, ReleaseGitHub.options.Version],
      ])
      expect(getNumberValueSpy.mock.calls).toEqual([[yargs.argv, ReleaseGitHub.options.BuildNumber]])
      expect(getBooleanValueSpy.mock.calls).toEqual([
        [yargs.argv, ReleaseGitHub.options.Draft],
        [yargs.argv, ReleaseGitHub.options.TagAsLatest],
      ])
      expect(validateFileSpy.mock.calls).toEqual([
        [notesFile, ReleaseGitHub.options.ReleaseNotes.key],
        [artifacts[0], ReleaseGitHub.options.Artifacts.key],
        [artifacts[1], ReleaseGitHub.options.Artifacts.key],
      ])
      expect(getJsonFromFileSpy.mock.calls).toEqual([[notesFilePath, ReleaseNoteSchema]])
      expect(createReleaseSpy.mock.calls).toEqual([
        [
          {
            apiUrl,
            artifactPaths,
            authToken,
            branch: buildBranch,
            draft,
            latest: tagAsLatest,
            notes: releaseNotes,
            number: buildNumber,
            owner,
            repo,
            target,
            uploadUrl,
            version,
          },
        ],
      ])
    })
  })

  describe('validateArguments', () => {
    it('calls to coercePositiveInteger and returns true', async () => {
      const args = await yargs.argv
      const coercePositiveIntegerSpy = jest.spyOn(Option, 'coercePositiveInteger').mockReturnValue()

      expect(ReleaseGitHub['validateArguments'](args)).toEqual(true)

      expect(coercePositiveIntegerSpy.mock.calls).toEqual([[args, ReleaseGitHub.options.BuildNumber]])
    })
  })

  describe('createRelease', () => {
    it('reaches out to github with required params', async () => {
      const apiUrl = 'https://api.github.com'
      const artifactPaths: string[] = []
      const authToken = '98765'
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const owner = 'corp'
      const repo = 'widget'
      const uploadUrl = 'https://uploads.github.com'
      const htmlUrl = 'https://my-html.com'
      const createReleaseSpy = jest.fn().mockResolvedValue({
        data: {
          id: '12345',
          html_url: htmlUrl,
        },
      })
      const uploadReleaseAssetSpy = jest.fn().mockResolvedValue(undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createOctokitSpy = jest.spyOn(ReleaseGitHub as any, 'createOctokit').mockReturnValue({
        repos: {
          createRelease: createReleaseSpy,
          uploadReleaseAsset: uploadReleaseAssetSpy,
        },
      })
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      await ReleaseGitHub.createRelease({
        apiUrl,
        artifactPaths,
        authToken,
        notes,
        owner,
        repo,
        uploadUrl,
        version,
      })

      expect(createOctokitSpy.mock.calls).toEqual([
        [
          {
            auth: authToken,
            baseUrl: apiUrl,
            userAgent: repo,
          },
        ],
      ])
      expect(createReleaseSpy.mock.calls).toEqual([
        [
          {
            owner,
            repo,
            tag_name: `v${version}`,
            target_commitish: undefined,
            make_latest: 'true',
            draft: false,
            name: version,
            body: '',
          },
        ],
      ])
      expect(uploadReleaseAssetSpy.mock.calls).toEqual([])
      expect(consoleLogSpy.mock.calls).toEqual([
        [`Creating release "${version}"...`],
        [`Release created at "${htmlUrl}"`],
      ])
    })
    it('reaches out to github with optional params', async () => {
      const apiUrl = 'https://api.github.com'
      const artifactPaths = ['test.txt', 'temp.json']
      const artifactData = ['hello', 'world']
      const artifactStats = [
        {
          size: 1,
        },
        {
          size: 2,
        },
      ]
      const authToken = '98765'
      const branch = '1.0'
      const draft = true
      const latest = false
      const version = '1.0.1'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const number = 1
      const owner = 'corp'
      const repo = 'widget'
      const target = '1.0'
      const uploadUrl = ''
      const release = {
        id: '1234',
        html_url: 'https://uploads.github.com',
      }
      const createReleaseSpy = jest.fn().mockResolvedValue({
        data: release,
      })
      const uploadReleaseAssetSpy = jest.fn().mockResolvedValue(undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createOctokitSpy = jest.spyOn(ReleaseGitHub as any, 'createOctokit').mockReturnValue({
        repos: {
          createRelease: createReleaseSpy,
          uploadReleaseAsset: uploadReleaseAssetSpy,
        },
      })
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const readFileSpy = jest
        .spyOn(fs, 'readFile')
        .mockResolvedValueOnce(artifactData[0])
        .mockResolvedValueOnce(artifactData[1])
      const statSpy = jest
        .spyOn(fs, 'stat')
        .mockResolvedValueOnce(artifactStats[0] as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .mockResolvedValueOnce(artifactStats[1] as any) // eslint-disable-line @typescript-eslint/no-explicit-any

      await ReleaseGitHub.createRelease({
        apiUrl,
        artifactPaths,
        authToken,
        branch,
        draft,
        latest,
        notes,
        number,
        owner,
        repo,
        target,
        uploadUrl,
        version,
      })

      expect(createOctokitSpy.mock.calls).toEqual([
        [
          {
            auth: authToken,
            baseUrl: apiUrl,
            userAgent: repo,
          },
        ],
      ])
      expect(createReleaseSpy.mock.calls).toEqual([
        [
          {
            owner,
            repo,
            tag_name: `v${version}`,
            target_commitish: target,
            make_latest: 'false',
            draft: true,
            name: version,
            body: ['---', '', 'Additional Information', '* Build Branch: 1.0', '* Build Number: 1'].join('\n'),
          },
        ],
      ])
      expect(uploadReleaseAssetSpy.mock.calls).toEqual([
        [
          {
            owner,
            repo,
            release_id: release.id,
            name: artifactPaths[0],
            data: artifactData[0],
            headers: {
              'content-type': 'application/octet-stream',
              'content-length': artifactStats[0].size,
            },
            baseUrl: uploadUrl,
          },
        ],
        [
          {
            owner,
            repo,
            release_id: release.id,
            name: artifactPaths[1],
            data: artifactData[1],
            headers: {
              'content-type': 'application/octet-stream',
              'content-length': artifactStats[1].size,
            },
            baseUrl: uploadUrl,
          },
        ],
      ])
      expect(consoleLogSpy.mock.calls).toEqual([
        [`Creating release "${version}" from build "${number}"...`],
        [`Uploading artifact "${artifactPaths[0]}"...`],
        [`Uploading artifact "${artifactPaths[1]}"...`],
        [`Draft release created at "${release.html_url}"`],
      ])
      expect(readFileSpy.mock.calls).toEqual([[artifactPaths[0]], [artifactPaths[1]]])
      expect(statSpy.mock.calls).toEqual([[artifactPaths[0]], [artifactPaths[1]]])
    })
  })

  describe('createOctokit', () => {
    it('creates new OctoKit object', () => {
      const auth = '1234'
      const baseUrl = 'https://my-domain:443'
      const userAgent = 'foo'
      ReleaseGitHub['createOctokit']({
        auth,
        baseUrl,
        userAgent,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((Octokit as any).mock.calls).toEqual([
        [
          {
            auth,
            baseUrl,
            userAgent,
          },
        ],
      ])
    })
  })
})
