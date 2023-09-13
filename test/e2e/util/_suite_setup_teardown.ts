import crypto from 'crypto'
import fs from 'fs-extra'
import path from 'path'

import env from './e2e-env'
import { E2eTests, getTestName } from './e2e-test-info'
import Wiremock, { Mode as WiremockMode } from './wiremock'

/**
 * Scoped to test files (suites)
 * beforeAll -> runs at the beginning of each test file (suite)
 * beforeEach -> runs at the beginning of each test in each test file (suite)
 * afterEach -> runs at the end of each test in each test file (suite)
 * afterAll -> runs at the end of each test file (suite)
 */

beforeAll(async () => {
  if (env.E2E_WIREMOCK_MODE === WiremockMode.Record) {
    await fs.remove(Wiremock.baseDir)
  }
})

beforeEach(async () => {
  const testName = getTestName()
  const id = crypto.createHash('md5').update(testName).digest('hex')
  const directory = path.join(env.E2E_TEMP_WORK_DIR, id)
  await fs.ensureDir(directory)
  E2eTests[testName] = {
    id,
    directory,
  }
})
