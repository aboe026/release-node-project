import 'dotenv/config'
import { cleanEnv, num, str } from 'envalid'
import path from 'path'

export enum WiremockMode {
  Record = 'record',
  Playback = 'playback',
  None = 'none',
}

export default cleanEnv(process.env, {
  E2E_GITHUB_ORG: str({
    desc: 'The organization name in GitHub to test against',
  }),
  E2E_GITHUB_PAT: str({
    desc: 'The Personal Access Token to authenticate against GitHub',
  }),
  E2E_GITHUB_REPO_PREFIX: str({
    desc: 'The repository name in GitHub to test against',
    default: 'release-node-project-e2e-testing',
  }),
  E2E_NPM_REGISTRY_PORT: num({
    desc: 'The port to run the NPM registry used by E2E tests',
    default: 4873,
  }),
  E2E_TEMP_WORK_DIR: str({
    desc: 'The directory that E2E tests should create temporary projects for tests',
    default: path.join(__dirname, '../.temp-work-dir'),
  }),
  E2E_WIREMOCK_HOST: str({
    desc: 'The hostname to reach out to for WireMock requests',
    default: '127.0.0.1',
    example: 'host.docker.internal',
  }),
  E2E_WIREMOCK_MODE: str({
    desc: 'In what capacity Wiremock should be used when running the E2E tests',
    choices: [WiremockMode.Record, WiremockMode.Playback, WiremockMode.None],
    default: WiremockMode.None,
  }),
  E2E_WIREMOCK_PORT: num({
    desc: 'The port on which Wiremock should run a server to proxy HTTP(S) requests',
    default: 8443,
  }),
})
