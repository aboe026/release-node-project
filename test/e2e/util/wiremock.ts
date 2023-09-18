import { exec } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { promisify } from 'util'

import env from './e2e-env'
import E2eUtil from './e2e-util'

const execa = promisify(exec)

export default class Wiremock {
  static readonly baseDir = path.join(__dirname, '../wiremock-recordings')
  static readonly internalContainerPort = '8443'

  private started = false
  private containerName: string
  private proxyTo: string
  private record: boolean
  private port: number | undefined
  private directory: string

  constructor({ containerName, proxyTo, record }: { containerName: string; proxyTo: string; record: boolean }) {
    this.containerName = containerName
    this.proxyTo = proxyTo
    this.record = record
    this.directory = path.join(Wiremock.baseDir, this.containerName)
  }

  async start() {
    const command = [
      'docker',
      'run',
      '--rm',
      '-d',
      `--name=${this.containerName}`,
      `-p=8443`,
      `-v=${this.directory}:/home/wiremock`,
      'wiremock/wiremock:3.0.1-1',
      `--https-port=${Wiremock.internalContainerPort}`,
      `--proxy-all="${this.proxyTo}"`,
      // '--print-all-network-traffic',
    ]
    if (this.record) {
      command.push('--record-mappings')
    }
    await execa(command.join(' '))
    this.port = await this.getPort()
    this.started = true
    await this.waitToBeUp()
  }

  async stop() {
    await execa(`docker stop ${this.containerName}`)
  }

  // Apparently WireMock does not resolve redirects. This is a problem because those redirects might still be
  // making requests to resources we don't want to interact with (which is why we're using WireMock in the first place).
  // An example of this is the GitHub download URL for release assets get redirected to "https://objects.githubusercontent.com"
  // To keep "isolated" (and break reliance on external sites, even for redirects)
  // use this method to find the mapping files which contains the 302/redirect
  // to get the response status changed to 200, and have its corresponding
  // __files body changed to the contents found at the redirected URL (based off the "Location" header of the initial response)
  // In playback, calls to the original endpoint will no longer get redirected, but return the response that the redirect would have
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async resolveRedirects(fileNameFilter?: RegExp) {
    if (this.record) {
      const mappingsDir = path.join(this.directory, 'mappings')
      let mappingFiles = await fs.readdir(mappingsDir)
      if (fileNameFilter) {
        mappingFiles = mappingFiles.filter((mappingFile) => fileNameFilter.test(mappingFile))
      }
      if (mappingFiles.length === 0) {
        throw Error(`No mapping files matched RegExp of "${fileNameFilter}"`)
      }
      for (const mappingFile of mappingFiles) {
        const mappingFileName = path.join(mappingsDir, mappingFile)
        const mappingContents = await fs.readFile(mappingFileName, {
          encoding: 'utf-8',
        })
        const mappingJson = JSON.parse(mappingContents)
        if (mappingJson.response.status === 302) {
          mappingJson.response.status = 200
          await E2eUtil.downloadFile(
            mappingJson.response.headers.Location,
            path.join(this.directory, '__files', mappingJson.response.bodyFileName)
          )
          await fs.writeFile(mappingFileName, JSON.stringify(mappingJson, null, 2))
        }
      }
    }
  }

  getProxyTo() {
    return this.proxyTo
  }

  getUrl() {
    if (!this.started) {
      return this.proxyTo
    }
    return `https://${env.E2E_WIREMOCK_HOST}:${this.port}` // "localhost" does not work as Node 18+ uses ipv6
  }

  private async getPort() {
    let port: number
    try {
      const response = await execa(`docker inspect ${this.containerName}`)
      const json = JSON.parse(response.stdout)
      port = json[0].NetworkSettings.Ports[`${Wiremock.internalContainerPort}/tcp`][0].HostPort
    } catch (err: unknown) {
      throw Error(`Could not determine port for container "${this.containerName}": ${err}`)
    }
    return port
  }

  private async waitToBeUp(timeoutSecs = 10) {
    let ready = false
    const start = Date.now()
    let error
    const url = this.getUrl()
    while (!ready && Date.now() - start < timeoutSecs * 1000) {
      try {
        await fetch(`${url}/__admin`)
        ready = true
      } catch (err: unknown) {
        error = err
      }
    }
    if (!ready) {
      throw error
    }
  }
}
