import { exec } from 'child_process'
import fs from 'fs-extra'
import { GetResponseDataTypeFromEndpointMethod, RequestError } from '@octokit/types'
import { Octokit } from '@octokit/rest'
import path from 'path'
import { promisify } from 'util'

import { E2eTests, getTestName } from './util/e2e-test-info'
import E2eUtil, { ReleaseAsset } from './util/e2e-util'
import env, { WiremockMode } from './util/e2e-env'
import ReleaseNote from '../../src/release-note'
import Wiremock from './util/wiremock'

const execa = promisify(exec)
const octoTemp = new Octokit().rest
let github: typeof octoTemp
type BlobType = GetResponseDataTypeFromEndpointMethod<typeof github.git.createBlob>
const apiWiremock = new Wiremock({
  containerName: 'release-node-project-e2e-api',
  proxyTo: 'https://api.github.com',
  record: env.E2E_WIREMOCK_MODE === WiremockMode.Record,
})
const uploadWiremock = new Wiremock({
  containerName: 'release-node-project-e2e-upload',
  proxyTo: 'https://uploads.github.com',
  record: env.E2E_WIREMOCK_MODE === WiremockMode.Record,
})

describe('Release GitHub', () => {
  beforeAll(async () => {
    if (env.E2E_WIREMOCK_MODE !== WiremockMode.None) {
      await Promise.all([apiWiremock.start(), uploadWiremock.start()])
    }
    github = new Octokit({
      auth: env.E2E_GITHUB_PAT,
      userAgent: env.E2E_GITHUB_REPO_PREFIX,
      baseUrl: apiWiremock.getUrl(),
    }).rest
  })
  afterAll(async () => {
    if (env.E2E_WIREMOCK_MODE !== WiremockMode.None) {
      await Promise.all([apiWiremock.stop(), uploadWiremock.stop()])
    }
  })
  beforeEach(async () => {
    console.log('TEST beforeEach 0')
    await github.repos.createForAuthenticatedUser({
      name: getGitHubRepo(),
      auto_init: true,
      private: true,
    })
    console.log('TEST beforeEach 1')
  })
  afterEach(async () => {
    try {
      await github.repos.delete({
        owner: env.E2E_GITHUB_ORG,
        repo: getGitHubRepo(),
      })
    } catch (err: unknown) {
      // ignore error about it not existing, that is the desired end state of deleting anyways
      if ((err as RequestError).status !== 404) {
        throw err
      }
    }
  })
  describe('invalid', () => {
    it('throws error if missing auth-token', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`, `--version=${version}`].join(' '),
        envVars: {
          NODE_TLS_REJECT_UNAUTHORIZED: '0',
        },
        error: 'Missing required argument: auth-token',
      })
    })
    it('throws error if missing org', async () => {
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--repo=${repo}`, `--version=${version}`].join(' '),
        error: 'Missing required argument: owner',
      })
    })
    it('throws error if missing repo', async () => {
      const org = env.E2E_GITHUB_ORG
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--version=${version}`].join(' '),
        error: 'Missing required argument: repository',
      })
    })
    it('throws error if missing version', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`].join(' '),
        error: 'Missing required argument: version',
      })
    })
    it('throws error if notes file does not exist', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const directory = E2eTests[getTestName()].directory
      const notesFilePath = 'non-existent-file.json'
      const absoluteNotesFilePath = path.join(directory, notesFilePath).replace(/\\/g, '\\\\')

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`, `--version=${version}`, `--notes=${notesFilePath}`].join(' '),
        error: `Error: Could not access file "${absoluteNotesFilePath}": Error: ENOENT: no such file or directory, access '${absoluteNotesFilePath}'`,
      })
    })
    it('throws error if notes file contains invalid JSON', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const directory = E2eTests[getTestName()].directory
      const notesFilePath = 'invalid-json.txt'
      const absoluteNotesFilePath = path.join(directory, notesFilePath).replace(/\\/g, '\\\\')

      await fs.writeFile(absoluteNotesFilePath, 'invalid json')
      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`, `--version=${version}`, `--notes=${notesFilePath}`].join(' '),
        error: `Could not parse file "${absoluteNotesFilePath}" as JSON: SyntaxError: Unexpected token i in JSON at position 0`,
      })
    })
    it('throws error if notes file contains invalid schema', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const directory = E2eTests[getTestName()].directory
      const notesFilePath = 'invalid-schema.json'
      const absoluteNotesFilePath = path.join(directory, notesFilePath).replace(/\\/g, '\\\\')

      await fs.writeFile(
        absoluteNotesFilePath,
        JSON.stringify(
          [
            {
              description: 'invalid schema',
            },
          ],
          null,
          2
        )
      )
      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`, `--version=${version}`, `--notes=${notesFilePath}`].join(' '),
        error: `Invalid "${absoluteNotesFilePath}" contents:(.|\n)*must have property 'version'`,
      })
    })
    it('throws error if build number not numeric', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const build = 'one'

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`, `--version=${version}`, `--build=${build}`].join(' '),
        error: `Invalid value "one" for option "build", must be positive integer.`,
      })
    })
    it('throws error if asset path invalid', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
        },
      ]
      const fileName = 'does-not-exist.json'
      const filePath = path
        .join(E2eTests[getTestName()].directory, fileName)
        .replace(/\\/g, '\\\\')
        .replace(/\./g, '\\.')

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--org=${org}`, `--repo=${repo}`, `--version=${version}`, `--asset=${fileName}`].join(' '),
        error: `Could not access file "${filePath}": Error: ENOENT: no such file or directory, access '${filePath}'`,
      })
    })
    it('throws error if repo does not exist', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
          description: 'Repo does not exist',
          features: ['Repo DNE Test'],
        },
      ]

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [
          `--api=${apiWiremock.getUrl()}`,
          `--org=${org}`,
          `--repo=${repo}-non-existent`,
          `--version=${version}`,
        ].join(' '),
        error: `RequestError \\[HttpError\\]: Not Found`,
      })
    })
  })
  describe('valid', () => {
    it('creates first release with required inputs', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
          description: 'Initial Release Required',
          features: ['Required Test'],
        },
      ]

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        version,
      })
      await testRelease({
        options: [`--api=${apiWiremock.getUrl()}`, `--org=${org}`, `--repo=${repo}`, `--version=${version}`].join(' '),
        body: 'Initial Release Required\n\n---\n\n**New Features**\n* Required Test\n\n',
        org: env.E2E_GITHUB_ORG,
        repo: getGitHubRepo(),
        version,
      })
    })
    it('creates first release with optional inputs', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '1.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
          description: 'Initial Release Optional',
          fixes: ['Optional Test'],
        },
      ]
      const assets: ReleaseAsset[] = [
        {
          fileName: 'deliverable.txt',
          content: 'Hello World!',
        },
      ]
      const branch = '1.0'
      const build = 1
      const draft = true
      const latest = false
      const notesFileName = 'changes.json'
      const target = '1.0'

      // create non-default branch
      await createBranch(org, repo, target)

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        notesFileName: notesFileName,
        assets,
        version,
      })
      await testRelease({
        options: [
          `--api=${apiWiremock.getUrl()}`,
          `--artifact=${assets[0].fileName}`,
          `--branch=${branch}`,
          `--build=${build}`,
          `--draft=${draft}`,
          `--latest=${latest}`,
          `--notes=${notesFileName}`,
          `--org=${org}`,
          `--repo=${repo}`,
          `--target=${target}`,
          `--upload=${uploadWiremock.getUrl()}`,
          `--version=${version}`,
        ].join(' '),
        assets,
        build,
        draft,
        body: 'Initial Release Optional\n\n---\n\n**Bug Fixes**\n* Optional Test\n\n---\n\nAdditional Information\n* Build Branch: 1.0\n* Build Number: 1',
        org,
        repo,
        latest,
        target: target,
        version,
      })
      await apiWiremock.resolveRedirects(new RegExp(`.*${repo}-releases-assets-.*`))
    })
    it('creates second release with multiple assets', async () => {
      const org = env.E2E_GITHUB_ORG
      const repo = getGitHubRepo()
      const version = '2.0.0'
      const notes: ReleaseNote[] = [
        {
          version,
          description: 'Second Release',
          breaking: ['Multiple Assets'],
        },
      ]
      const assets: ReleaseAsset[] = [
        {
          fileName: 'deliverable.txt',
          content: 'Hello World!',
        },
        {
          fileName: 'manifest.json',
          content: JSON.stringify({ foo: 'bar' }, null, 2),
        },
      ]
      const latest = false

      // create first release
      await github.repos.createRelease({
        owner: org,
        repo,
        tag_name: 'v1.0.0',
      })

      // create new commit for new release
      await uploadFileAsNewCommit({
        org,
        repo,
        commitMessage: 'Commit for new release',
        fileName: 'newReleaseFile.txt',
      })

      await E2eUtil.createTestFiles({
        command: 'github',
        notes,
        assets,
        version,
      })
      await testRelease({
        options: [
          `--api=${apiWiremock.getUrl()}`,
          `--asset=${assets[0].fileName}`,
          `--asset=${assets[1].fileName}`,
          `--org=${org}`,
          `--repo=${repo}`,
          `--upload=${uploadWiremock.getUrl()}`,
          `--version=${version}`,
        ].join(' '),
        body: 'Second Release\n\n---\n\n**Breaking Changes**\n* Multiple Assets\n\n',
        org: env.E2E_GITHUB_ORG,
        assets,
        latest,
        repo: getGitHubRepo(),
        version,
        expectedReleases: 2,
      })
      await apiWiremock.resolveRedirects(new RegExp(`.*${repo}-releases-assets-.*`))
    })
  })
})

function getGitHubRepo() {
  return `${env.E2E_GITHUB_REPO_PREFIX}-${E2eTests[getTestName()].id}`
}

async function testRelease({
  options,
  envVars = {
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
    RELEASE_NODE_PROJECT_AUTH_TOKEN: env.E2E_GITHUB_PAT,
  },
  error,
  assets = [],
  build,
  draft = false,
  body,
  org = env.E2E_GITHUB_ORG,
  repo = getGitHubRepo(),
  latest = true,
  target,
  version,
  expectedReleases = 1,
}: {
  options?: string
  envVars?: NodeJS.ProcessEnv
  error?: string
  assets?: ReleaseAsset[]
  build?: number
  draft?: boolean
  body?: string
  org?: string
  repo?: string
  latest?: boolean
  target?: string
  version?: string
  expectedReleases?: number
}) {
  const directory = E2eTests[getTestName()].directory
  const command = `npm run github${options ? ` -- ${options}` : ''}`
  console.log(`TEST directory: '${directory}'`)
  console.log(`TEST envVars: '${JSON.stringify(envVars)}'`)
  const promise = execa(command, {
    cwd: directory,
    env: envVars,
  })
  if (error) {
    await expect(promise).rejects.toThrow(new RegExp(`.*${error}.*`))
    const { data: releases } = await github.repos.listReleases({
      owner: org,
      repo,
    })
    expect(releases).toHaveLength(0)
  } else {
    const expectedOutput = [
      '',
      '> github',
      `> release-node-project github${options ? ` ${options.replace(/"/g, '')}` : ''}`,
      '',
      `Creating release "${version}"${build ? ` from build "${build}"` : ''}...`,
    ]
    if (assets) {
      for (const asset of assets) {
        expectedOutput.push(`Uploading artifact "${path.join(directory, asset.fileName)}"...`)
      }
    }

    const response = await promise

    // sleep needed or else "listReleases" returns empty array
    // apparently there is a small delay for GitHub to actually register the new release?
    await E2eUtil.sleep(2)
    const { data: releases } = await github.repos.listReleases({
      owner: org,
      repo,
    })
    if (expectedReleases) {
      expect(releases).toHaveLength(expectedReleases)
    }
    const release = releases.find((release) => release.name === version)
    expect(release).not.toEqual(undefined)
    if (release) {
      const releaseUrl = release.html_url
      const urlTag = draft ? releaseUrl.substring(releaseUrl.lastIndexOf('/') + 1) : `v${version}`

      expectedOutput.push(
        `${draft ? 'Draft release' : 'Release'} created at "https://github.com/${org}/${repo}/releases/tag/${urlTag}"`
      )
      expectedOutput.push('')
      expect(response.stdout).toEqual(expectedOutput.join('\n'))
      expect(response.stderr).toMatch(
        new RegExp(
          [
            "\\(node:\\d+\\) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification\\.",
            '\\(Use `node --trace-warnings ...` to show where the warning was created\\)',
            '',
          ].join('\n'),
          'gm'
        )
      )

      expect(release).toMatchObject({
        draft,
        target_commitish: target || 'main',
        tag_name: `v${version}`,
        assets: assets?.map((asset) => {
          return {
            name: asset.fileName,
          }
        }),
        body,
      })
      for (const asset of assets) {
        const releaseAsset = release.assets.find((releaseAsset) => releaseAsset.name === asset.fileName)
        if (!releaseAsset) {
          throw Error(`Release asset "${asset.fileName}' does not exist in "${JSON.stringify(release.assets)}"`)
        }
        const assetDownloadFileName = path.join(directory, 'actual-assets', asset.fileName)
        const downloadUrl = releaseAsset.url.replace(apiWiremock.getProxyTo(), apiWiremock.getUrl())
        await E2eUtil.downloadFile(downloadUrl, assetDownloadFileName, {
          Accept: 'application/octet-stream',
          Authorization: `token ${env.E2E_GITHUB_PAT}`,
          'User-Agent': env.E2E_GITHUB_REPO_PREFIX,
        })
        const assetDownloadContents = await fs.readFile(assetDownloadFileName, {
          encoding: 'utf-8',
        })
        expect(assetDownloadContents).toEqual(asset.content)
      }

      // verify latest release
      let latestRelease
      try {
        const response = await github.repos.getLatestRelease({
          owner: org,
          repo,
        })
        latestRelease = response.data
      } catch (err: unknown) {
        // if it does not exist, keep latestRelease as undefined
        if ((err as RequestError).status !== 404) {
          throw err
        }
      }
      if (latest) {
        expect(release).toEqual(latestRelease)
      } else {
        expect(release).not.toEqual(latestRelease)
      }
    }
  }
}

async function createBranch(org: string, repo: string, branch: string) {
  const { data: commit } = await github.repos.getCommit({
    owner: org,
    repo,
    ref: 'main',
  })
  await github.git.createRef({
    owner: org,
    repo,
    ref: `refs/heads/${branch}`,
    sha: commit.sha,
  })
}

async function uploadFileAsNewCommit({
  org,
  repo,
  branch = 'main',
  commitMessage,
  fileName,
}: {
  org: string
  repo: string
  branch?: string
  commitMessage: string
  fileName: string
}) {
  const currentCommit = await getCurrentCommit(org, repo, branch)
  const directory = E2eTests[getTestName()].directory
  const subdir = path.join(directory, 'commit-files')
  await fs.ensureDirSync(subdir)
  const filePath = path.join(subdir, fileName)
  await fs.writeFileSync(filePath, commitMessage)
  const blob = await createBlobForFile(org, repo, filePath)
  const newTree = await createNewTree(org, repo, [blob], [path.relative(directory, filePath)], currentCommit.treeSha)
  const { data: newCommit } = await github.git.createCommit({
    owner: org,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [currentCommit.commitSha],
  })
  github.git.updateRef({
    owner: org,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  })
}

async function getCurrentCommit(org: string, repo: string, branch = 'main') {
  const { data: refData } = await github.git.getRef({
    owner: org,
    repo,
    ref: `heads/${branch}`,
  })
  const commitSha = refData.object.sha
  const { data: commitData } = await github.git.getCommit({
    owner: org,
    repo,
    commit_sha: commitSha,
  })
  return {
    commitSha,
    treeSha: commitData.tree.sha,
  }
}

async function createBlobForFile(org: string, repo: string, filePath: string): Promise<BlobType> {
  const content = await fs.readFile(filePath, {
    encoding: 'utf-8',
  })
  const blobData = await github.git.createBlob({
    owner: org,
    repo,
    content,
    encoding: 'utf-8',
  })
  return blobData.data
}

async function createNewTree(owner: string, repo: string, blobs: BlobType[], paths: string[], parentTreeSha: string) {
  const { data } = await github.git.createTree({
    owner,
    repo,
    tree: blobs.map(({ sha }, index) => ({
      path: paths[index],
      mode: '100644',
      type: 'blob',
      sha,
    })),
    base_tree: parentTreeSha,
  })
  return data
}
