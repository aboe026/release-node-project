import { exec } from 'child_process'
import fs from 'fs-extra'
import { promisify } from 'util'

import env from './e2e-env'
import { PackageTarballPath } from './constants'

const execa = promisify(exec)

/**
 * Run once before all tests execute
 */

export default async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // prevent errors about self-signed certs (for wiremock)
  await fs.remove(env.E2E_TEMP_WORK_DIR)
  await fs.ensureDir(env.E2E_TEMP_WORK_DIR)
  await execa('yarn build')
  await execa(`yarn pack --out=${PackageTarballPath}`)
}
