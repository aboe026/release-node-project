import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

import env from './e2e-env'

const execa = promisify(exec)

export default class Wiremock {
  static readonly baseDir = path.join(__dirname, '../wiremock-recordings')
  static readonly internalContainerPort = '8443'

  private started = false
  private containerName: string
  private proxyTo: string
  private record: boolean
  private port: number | undefined

  constructor({ containerName, proxyTo, record }: { containerName: string; proxyTo: string; record: boolean }) {
    this.containerName = containerName
    this.proxyTo = proxyTo
    this.record = record
  }

  async start() {
    const command = [
      'docker',
      'run',
      '--rm',
      '-d',
      `--name=${this.containerName}`,
      `-p=8443`,
      `-v=${path.join(Wiremock.baseDir, this.containerName)}:/home/wiremock`,
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
