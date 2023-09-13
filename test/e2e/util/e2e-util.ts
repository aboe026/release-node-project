import { exec } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { promisify } from 'util'
import { Readable } from 'stream'
import { finished } from 'stream/promises'

import { E2eTests, getTestName } from '../util/e2e-test-info'
import { PackageTarballPath } from '../util/constants'
import ReleaseNote from '../../../src/release-note'

const execa = promisify(exec)

export default class E2eUtil {
  static async sleep(seconds: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000)
    })
  }

  static async downloadFile(
    url: string,
    file: string,
    headers?: {
      [key: string]: string
    }
  ) {
    await fs.ensureDir(path.dirname(file))
    const requestHeaders = new Headers()
    if (headers) {
      for (const key in headers) {
        requestHeaders.append(key, headers[key])
      }
    }
    const response = await fetch(url, {
      headers: requestHeaders,
    })
    const fileStream = fs.createWriteStream(file, {
      flags: 'wx',
    })
    await finished(Readable.fromWeb(response.body as any).pipe(fileStream)) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  static async createTestFiles({
    command,
    notes,
    notesFileName = 'release-notes.json',
    assets,
    version,
  }: {
    command: string
    notes: ReleaseNote[]
    notesFileName?: string
    assets?: ReleaseAsset[]
    version: string
  }) {
    const directory = E2eTests[getTestName()].directory
    const packageJsonPath = path.join(directory, 'package.json')
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(
        {
          version,
          scripts: {
            [command]: `release-node-project ${command}`,
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
    await fs.writeFile(path.join(directory, notesFileName), JSON.stringify(notes, null, 2))
    if (assets && assets.length > 0) {
      for (const asset of assets) {
        await fs.writeFile(path.join(directory, asset.fileName), asset.content)
      }
    }
  }
}

export interface ReleaseAsset {
  fileName: string
  content: string
}
