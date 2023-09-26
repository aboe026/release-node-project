import { Arguments, Argv, CommandModule } from 'yargs'
import fs from 'fs/promises'
import { Octokit } from '@octokit/rest'
import path from 'path'

import FileUtil from './file-util'
import { getDescription } from './release-description'
import Option from './option'
import ReleaseNote, { schema as ReleaseNoteSchema } from './release-note'

const octoDummyRest = new Octokit().rest // only needed to get the "RestEndpointMethods" type below
type RestEndpointMethods = typeof octoDummyRest

/**
 * Class for releasing a GitHub project
 */
export default class ReleaseGitHub {
  /**
   * The options available for this command
   */
  static readonly options = {
    ApiUrl: new Option({
      key: 'api-url',
      value: {
        alias: ['api'],
        description: 'The URL of the GitHub API to interact with',
        type: 'string',
        default: 'https://api.github.com',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    Artifacts: new Option({
      key: 'artifacts',
      value: {
        alias: ['a', 'artifact', 'asset', 'assets'],
        description: 'A path to an artifact to upload to the GitHub release',
        type: 'array',
        demandOption: false,
        requiresArg: true,
      },
    }),
    AuthToken: new Option({
      key: 'auth-token',
      value: {
        alias: ['auth', 'token'],
        description:
          'The token used to authenticate with GitHub. Can be Personal Access Token, OAuth app Access Token, etc.',
        type: 'string',
        demandOption: true,
        requiresArg: true,
        nargs: 1,
      },
    }),
    BuildBranch: new Option({
      key: 'build-branch',
      value: {
        alias: ['b', 'branch'],
        description: 'The branch the release is based on',
        type: 'string',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    BuildNumber: new Option({
      key: 'build-number',
      value: {
        alias: ['build', 'number'],
        description: 'The number of the build that produced the artifact being released',
        type: 'string', // otherwise does not throw an error on invalid input (https://github.com/yargs/yargs/issues/1079)
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    Draft: new Option({
      key: 'draft',
      value: {
        alias: ['d'],
        description: 'Whether or not the release in GitHub should be created as a draft or publicly available',
        type: 'boolean',
        default: false,
        demandOption: false,
        requiresArg: false,
        nargs: 1,
      },
    }),
    Owner: new Option({
      key: 'owner',
      value: {
        alias: ['o', 'org'],
        description: 'The owner/organization of the GitHub repository',
        type: 'string',
        demandOption: true,
        requiresArg: true,
        nargs: 1,
      },
    }),
    ReleaseNotes: new Option({
      key: 'release-notes',
      value: {
        alias: ['n', 'notes'],
        description: 'The path to the file containing release notes JSON',
        type: 'string',
        default: 'release-notes.json',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    Repo: new Option({
      key: 'repository',
      value: {
        alias: ['r', 'repo'],
        description: 'The name of the GitHub repository to create the release on',
        type: 'string',
        demandOption: true,
        requiresArg: true,
        nargs: 1,
      },
    }),
    TagAsLatest: new Option({
      key: 'tag-as-latest',
      value: {
        alias: ['l', 'latest'],
        description: 'Whether or not the version should also be denoted as the "latest" in GitHub',
        type: 'boolean',
        default: true,
        demandOption: false,
        requiresArg: false,
        nargs: 1,
      },
    }),
    Target: new Option({
      key: 'target',
      value: {
        alias: ['t'],
        description:
          "The commitish value that determines where the Git tag is created from for the release. Can be any branch or commit SHA. Defaults to repository's default branch",
        type: 'string',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    UploadUrl: new Option({
      key: 'upload-url',
      value: {
        alias: ['upload'],
        description: 'The base URL to use when uploading assets to GitHub',
        type: 'string',
        default: 'https://uploads.github.com',
        demandOption: false,
        requiresArg: true,
        nargs: 1,
      },
    }),
    Version: new Option({
      key: 'version',
      value: {
        alias: ['v'],
        description: 'The version being released',
        type: 'string',
        demandOption: true,
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
      command: ['release-github'],
      aliases: ['github'],
      describe: 'Create a release in GitHub',
      builder: (yargs: Argv) =>
        yargs
          .option(ReleaseGitHub.options.Artifacts.key, ReleaseGitHub.options.Artifacts.value)
          .option(ReleaseGitHub.options.AuthToken.key, ReleaseGitHub.options.AuthToken.value)
          .option(ReleaseGitHub.options.BuildBranch.key, ReleaseGitHub.options.BuildBranch.value)
          .option(ReleaseGitHub.options.BuildNumber.key, ReleaseGitHub.options.BuildNumber.value)
          .option(ReleaseGitHub.options.Draft.key, ReleaseGitHub.options.Draft.value)
          .option(ReleaseGitHub.options.ApiUrl.key, ReleaseGitHub.options.ApiUrl.value)
          .option(ReleaseGitHub.options.ReleaseNotes.key, ReleaseGitHub.options.ReleaseNotes.value)
          .option(ReleaseGitHub.options.Owner.key, ReleaseGitHub.options.Owner.value)
          .option(ReleaseGitHub.options.Repo.key, ReleaseGitHub.options.Repo.value)
          .option(ReleaseGitHub.options.TagAsLatest.key, ReleaseGitHub.options.TagAsLatest.value)
          .option(ReleaseGitHub.options.Target.key, ReleaseGitHub.options.Target.value)
          .option(ReleaseGitHub.options.UploadUrl.key, ReleaseGitHub.options.UploadUrl.value)
          .version(false)
          .option(ReleaseGitHub.options.Version.key, ReleaseGitHub.options.Version.value)
          .check(ReleaseGitHub.validateArguments),
      handler: async (argv: Arguments) => {
        const artifacts: string[] = Option.getStringArrayValues(argv, ReleaseGitHub.options.Artifacts) || []
        const authToken = Option.getRequiredStringValue(argv, ReleaseGitHub.options.AuthToken)
        const branch = Option.getStringValue(argv, ReleaseGitHub.options.BuildBranch)
        const number = Option.getNumberValue(argv, ReleaseGitHub.options.BuildNumber)
        const draft = Option.getBooleanValue(argv, ReleaseGitHub.options.Draft)
        const apiUrl = Option.getRequiredStringValue(argv, ReleaseGitHub.options.ApiUrl)
        const notesFile = Option.getRequiredStringValue(argv, ReleaseGitHub.options.ReleaseNotes)
        const owner = Option.getRequiredStringValue(argv, ReleaseGitHub.options.Owner)
        const repo = Option.getRequiredStringValue(argv, ReleaseGitHub.options.Repo)
        const latest = Option.getBooleanValue(argv, ReleaseGitHub.options.TagAsLatest)
        const target = Option.getStringValue(argv, ReleaseGitHub.options.Target)
        const uploadUrl = Option.getRequiredStringValue(argv, ReleaseGitHub.options.UploadUrl)
        const version = Option.getRequiredStringValue(argv, ReleaseGitHub.options.Version)

        const notesFilePath = await FileUtil.validateFile(notesFile, ReleaseGitHub.options.ReleaseNotes.key)
        const notes = await FileUtil.getJsonFromFile(notesFilePath, ReleaseNoteSchema)
        const artifactPaths = await Promise.all(
          artifacts.map((artifact) => FileUtil.validateFile(artifact, ReleaseGitHub.options.Artifacts.key))
        )

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
      },
    }
  }

  /**
   * Validates that the arguments provided have valid values, otherwise throws an Error
   *
   * @param argv The options passed into the CLI
   * @returns True if the arguments have valid values, throws Error otherwise
   */
  private static validateArguments(argv: Arguments) {
    Option.coercePositiveInteger(argv, ReleaseGitHub.options.BuildNumber)
    return true
  }

  /**
   * Create a Release in GitHub
   *
   * @param params The information needed to create the release
   */
  static async createRelease({
    apiUrl,
    artifactPaths,
    authToken,
    branch,
    draft = false,
    latest = true,
    notes,
    number,
    owner,
    repo,
    target,
    uploadUrl,
    version,
  }: {
    apiUrl: string
    artifactPaths: string[]
    authToken: string
    branch?: string | undefined
    draft?: boolean
    latest?: boolean
    notes: ReleaseNote[]
    number?: number
    owner: string
    repo: string
    target?: string
    uploadUrl: string
    version: string
  }) {
    const github = ReleaseGitHub.createOctokit({
      auth: authToken,
      baseUrl: apiUrl,
      userAgent: repo,
    })

    console.log(`Creating release "${version}"${number !== undefined ? ` from build "${number}"` : ''}...`)
    const { data: release } = await github.repos.createRelease({
      owner,
      repo,
      tag_name: `v${version}`,
      target_commitish: target,
      make_latest: latest ? 'true' : 'false',
      draft,
      name: version,
      body: getDescription({
        notes,
        version,
        buildBranch: branch,
        buildNumber: (number || '').toString(),
      }),
    })

    for (const artifactPath of artifactPaths) {
      console.log(`Uploading artifact "${artifactPath}"...`)
      await github.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: release.id,
        name: path.basename(artifactPath),
        data: (await fs.readFile(artifactPath)) as unknown as string,
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': (await fs.stat(artifactPath)).size,
        },
        baseUrl: uploadUrl,
      })
    }

    console.log(`${draft ? 'Draft release' : 'Release'} created at "${release.html_url}"`)
  }

  /**
   * Create an OctoKit instance to interact with GitHub REST APIs
   *
   * @param params The configuration required to interact with GitHub
   * @returns
   */
  private static createOctokit({
    auth,
    baseUrl,
    userAgent,
  }: {
    auth: string
    baseUrl: string
    userAgent: string
  }): RestEndpointMethods {
    return new Octokit({
      auth,
      baseUrl,
      userAgent,
    }).rest
  }
}
